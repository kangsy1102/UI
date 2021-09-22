# -*- coding: utf-8 -*-
from django.test import TestCase
from unittest.mock import patch, MagicMock
from logindotgov.mock_server import OIDC as MockServer
from urllib.parse import urlparse, parse_qsl
from django.test.utils import override_settings
from django.conf import settings

# import pprint

# set up the mock OIDC server
MockServer.register_client(
    settings.LOGIN_DOT_GOV_CLIENT_ID,
    settings.LOGIN_DOT_GOV_PUBLIC_KEY,
    settings.LOGIN_DOT_GOV_REDIRECT_URI,
)


def mocked_logindotdov_oidc_server(*args, **kwargs):
    server = MockServer()
    return server.route_request(args, kwargs)


def mimic_oidc_server_authorized(url):
    login_uri_parsed = urlparse(url)
    login_query = dict(parse_qsl(login_uri_parsed.query))
    authorize_response = MockServer.authorize_endpoint(login_query)
    authorize_parsed = urlparse(authorize_response.json_data)
    return authorize_parsed


@patch(
    "logindotgov.oidc.requests.get",
    new=MagicMock(side_effect=mocked_logindotdov_oidc_server),
)
@patch(
    "logindotgov.oidc.requests.post",
    new=MagicMock(side_effect=mocked_logindotdov_oidc_server),
)
class LoginDotGovTestCase(TestCase):
    @override_settings(DEBUG=True)  # so that /explain works
    def test_oidc_flow(self):
        response = self.client.get("/logindotgov/")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)

        # the server will redirect to here
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(response, "/logindotgov/explain", status_code=302)

        # confirm our session looks as we expect
        response = self.client.get("/logindotgov/explain")
        explained = response.json()
        whoami = explained["whoami"]
        self.assertEquals(explained["verified"], True)
        self.assertEquals(whoami["email"], "you@example.gov")

    def test_session_verified(self):
        session = self.client.session
        session["verified"] = True
        session.save()

        response = self.client.get("/logindotgov/")
        self.assertRedirects(response, "/", status_code=302)

    def test_explain(self):
        response = self.client.get("/logindotgov/explain")
        self.assertEqual(response.status_code, 401)

    def test_oidc_errors(self):
        response = self.client.get("/logindotgov/")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)
        authorize_params = dict(parse_qsl(authorize_parsed.query))

        # missing state or code
        response = self.client.get("/logindotgov/result?code=foo123")
        self.assertEquals(response.status_code, 403)
        self.assertEquals(response.content.decode("utf-8"), "Missing state param")
        response = self.client.get("/logindotgov/result?state=foo123")
        self.assertEquals(response.status_code, 403)
        self.assertEquals(response.content.decode("utf-8"), "Missing code param")

        # state does not match
        response = self.client.get(
            f"/logindotgov/result?state=wrong&code={authorize_params['code']}"
        )
        self.assertEquals(response.status_code, 403)
        self.assertEquals(response.content.decode("utf-8"), "state mismatch")

        # bad code
        response = self.client.get(
            f"/logindotgov/result?code=wrong&state={authorize_params['state']}"
        )
        self.assertEquals(response.status_code, 403)
        self.assertEquals(response.content.decode("utf-8"), "invalid code")

        # the nonce we sent initially changes
        session = self.client.session
        session["logindotgov"]["nonce"] = "changed"
        session.save()
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(response.status_code, 403)
        self.assertEquals(response.content.decode("utf-8"), "Error exchanging token")

    def test_redirect_to(self):
        session = self.client.session
        session["redirect_to"] = "/some/place/else"
        session.save()

        response = self.client.get("/logindotgov/")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)

        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response, "/some/place/else", status_code=302, fetch_redirect_response=False
        )