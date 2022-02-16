# -*- coding: utf-8 -*-
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.core.exceptions import BadRequest
import logging
import os
from django.conf import settings
import django.middleware.csrf
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone

from api.models.swa import SWA
from .decorators import authenticated_claimant_session
from .claim_finder import ClaimFinder
from .claim_request import ClaimRequest
from .claim_validator import ClaimValidator
from .claim_cleaner import ClaimCleaner
from .claim_serializer import ClaimSerializer
from .models import Claim
from .whoami import WhoAmI
from core.email import InitialClaimConfirmationEmail
from core.utils import register_local_login
from dacite import from_dict


logger = logging.getLogger("api")


def whoami_from_session(request):
    whoami_dict = request.session.get("whoami")
    logger.debug("🚀 whoami_dict: {}".format(whoami_dict))
    return from_dict(data_class=WhoAmI, data=whoami_dict)


@require_http_methods(["POST"])
@csrf_exempt
@never_cache
def login(request):
    """testing only"""
    whoami = register_local_login(request)
    return JsonResponse(whoami.as_dict(), status=200)


@require_http_methods(["POST"])
@authenticated_claimant_session
@never_cache
def logout(request):
    """testing only"""
    request.session.flush()
    return JsonResponse({"status": "ok"}, status=200)


@require_http_methods(["GET"])
@authenticated_claimant_session
@never_cache
def whoami(request):
    """
    returns JSON payload about the user with the current session.

    401 response means the session has either not yet been created
    or still requires IdP AAL2 login.
    """
    whoami = whoami_from_session(request)
    if "swa" in request.session and not (
        whoami.swa_code and whoami.swa_name and whoami.swa_claimant_url
    ):
        whoami.swa_code = request.session["swa"]
        swa = SWA.objects.get(code=whoami.swa_code)
        whoami.swa_name = swa.name
        whoami.swa_claimant_url = swa.claimant_url
    # set csrftoken cookie
    django.middleware.csrf.get_token(request)

    # always reset in case we mutated
    request.session["whoami"] = whoami.as_dict()
    return JsonResponse(whoami.as_dict(), status=200)


@require_http_methods(["GET"])
@never_cache
def index(request):
    """Root endpoint for the /api/ space. Returns metadata about the API itself."""
    return JsonResponse(
        {
            "version": "1.0",
            "sha": os.environ.get("UI_API_SHA", "N/A"),
            "build": os.environ.get("BUILD_TIME", "N/A"),
            "url": settings.BASE_URL
            if settings.BASE_URL
            else f"{request.scheme}://{request.get_host()}",
        }
    )


@require_http_methods(["GET"])
@authenticated_claimant_session
@never_cache
def claims(request):
    """
    returns JSON about all the Claims associated with the current Claimant
    """
    whoami = whoami_from_session(request)
    claims = ClaimFinder(whoami).all()
    if not claims:
        return JsonResponse({"claims": []}, status=200)
    return JsonResponse(
        {"claims": list(map(lambda c: ClaimSerializer(c).for_claimant(), claims))},
        status=200,
    )


@require_http_methods(["GET", "POST"])
@authenticated_claimant_session
@never_cache
def partial_claim(request):
    """GET or POST a partial claim. This method routes according to HTTP method."""
    if request.method == "GET":
        return GET_partial_claim(request)
    elif request.method == "POST":
        return POST_partial_claim(request)
    else:  # pragma: no cover
        raise BadRequest("require_http_methods failed to recognize GET or POST")


@require_http_methods(["GET", "POST"])
@authenticated_claimant_session
@never_cache
def completed_claim(request):
    """GET or POST a completed claim. This method routes according to HTTP method."""
    if request.method == "GET":
        return GET_completed_claim(request)
    elif request.method == "POST":
        return POST_completed_claim(request)
    else:  # pragma: no cover
        raise BadRequest("require_http_methods failed to recognize GET or POST")


###################################################################################################################
# private (not HTTP-routed) functions


def invalid_claim_response(claim_validator):
    return JsonResponse(
        {
            "status": "error",
            "error": "invalid claim",
            "errors": claim_validator.errors_as_dict(),
        },
        status=400,
    )


def POST_partial_claim(request):
    claim_request = ClaimRequest(request)
    if claim_request.error:
        logger.error(claim_request.error)
        return claim_request.response

    if claim_request.is_complete:
        return JsonResponse(
            {
                "status": "error",
                "error": "is_complete payload sent to partial-claim endpoint",
            },
            status=400,
        )

    claim_validator = ClaimValidator(claim_request.payload)
    if not claim_validator.valid:
        # we allow the save regardless because it may be (e.g.) a partial address
        pass
    else:
        # mark our payload with validation info
        claim_request.payload["validated_at"] = timezone.now().isoformat()
        claim_request.payload["$schema"] = claim_validator.schema_url

    # log we received the claim
    claim_request.claim.events.create(category=Claim.EventCategories.SUBMITTED)

    # now that we have a Claim, stash its info in session
    request.session["whoami"]["claim_id"] = claim_request.payload["id"]
    request.session["partial_claim"] = claim_request.payload

    # save the partial (incomplete) claim
    if claim_request.claim.write_partial(claim_request.payload):
        body = {"status": "accepted", "claim_id": claim_request.payload["id"]}
        if not claim_validator.valid:
            body["validation_errors"] = claim_validator.errors_as_dict()
        return JsonResponse(body, status=202)
    else:
        return JsonResponse(
            {"status": "error", "error": "unable to save claim"}, status=500
        )


def GET_partial_claim(request):
    if "partial_claim" in request.session:
        return JsonResponse(request.session["partial_claim"], status=200)

    whoami = whoami_from_session(request)
    claim = ClaimFinder(whoami).find()
    claim_not_found_response = JsonResponse(
        {
            "status": "error",
            "error": "partial claim not found for SWA {} with Claimant {}".format(
                whoami.swa_code, whoami.claimant_id
            ),
        },
        status=404,
    )
    if not claim:
        return claim_not_found_response
    partial_claim = claim.read_partial()
    if partial_claim:
        logger.debug("🚀 found partial claim for {}".format(claim.uuid))
        request.session["partial_claim"] = partial_claim
        return JsonResponse(partial_claim, status=200)

    logger.debug("🚀 no partial claim read for {}".format(claim.uuid))
    return claim_not_found_response


def POST_completed_claim(request):
    claim_request = ClaimRequest(request)
    if claim_request.error:
        logger.error(claim_request.error)
        return claim_request.response

    if not claim_request.is_complete:
        return JsonResponse(
            {
                "status": "error",
                "error": "is_complete payload false/missing at completed-claim endpoint",
            },
            status=400,
        )

    # validate with complete schema
    claim_request.payload = ClaimCleaner(claim_request).cleaned()
    claim_validator = ClaimValidator(claim_request.payload)
    if not claim_validator.valid:
        return invalid_claim_response(claim_validator)
    elif not claim_validator.validate_against_whoami(claim_request.whoami):
        return invalid_claim_response(claim_validator)
    else:
        # mark our payload with validation info
        claim_request.payload["validated_at"] = timezone.now().isoformat()
        claim_request.payload["$schema"] = claim_validator.schema_url

    # log we received the claim
    claim_request.claim.events.create(category=Claim.EventCategories.SUBMITTED)

    # ok to package for SWA
    if claim_request.claim.write_completed(claim_request.payload):
        InitialClaimConfirmationEmail(
            email_address=claim_request.whoami.email,
            claim=claim_request.claim,
        ).send_later()

        # now that Claim is completed, forget it in the session.
        if request.session["whoami"].get("claim_id"):
            del request.session["whoami"]["claim_id"]

        return JsonResponse(
            {"status": "accepted", "claim_id": claim_request.payload["id"]}, status=201
        )
    else:
        return JsonResponse(
            {"status": "error", "error": "unable to save claim"}, status=500
        )


def GET_completed_claim(request):
    whoami = whoami_from_session(request)
    claim = ClaimFinder(whoami).find()
    if not claim or not claim.is_completed() or claim.is_resolved():
        logger.debug("🚀 not found {}".format(claim))
        return JsonResponse(
            {"status": "error", "error": "No completed claim found"}, status=404
        )

    response_claim = ClaimSerializer(claim).for_claimant()
    return JsonResponse(response_claim, status=200)
