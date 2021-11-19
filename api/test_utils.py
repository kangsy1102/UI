# -*- coding: utf-8 -*-
from .models import IdentityProvider, SWA, Claimant
from core.test_utils import generate_keypair


def create_idp():
    idp = IdentityProvider(name="my identity provider")
    idp.save()
    return idp


def create_swa(is_active=False, code="KS"):
    private_key_jwk, public_key_jwk = generate_keypair()

    # ad astra per aspera (the KS state motto)
    swa = SWA(
        code=code,
        name=f"{code} state name",
        public_key=public_key_jwk.export_to_pem().decode("utf-8"),
        public_key_fingerprint=public_key_jwk.thumbprint(),
    )
    if is_active:
        swa.status = SWA.StatusOptions.ACTIVE
    swa.save()
    return swa, private_key_jwk


def create_claimant(idp):
    claimant = Claimant(
        idp_user_xid="my idp id",
        idp=idp,
    )
    claimant.save()
    return claimant
