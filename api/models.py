# -*- coding: utf-8 -*-
from django.db import models
import uuid


# we specify table names because these models will be accessed from
# other apps (like the swas app) so we prefer not to namespace them with api_*


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class IdentityProvider(TimeStampedModel):
    class Meta:
        db_table = "identity_providers"

    name = models.CharField(max_length=255, unique=True)


class ActiveSwaManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status=SWA.StatusOptions.ACTIVE)


class SWA(TimeStampedModel):
    class Meta:
        db_table = "swas"

    class StatusOptions(models.IntegerChoices):
        INACTIVE = 0
        ACTIVE = 1

    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=255, unique=True)
    public_key_fingerprint = models.CharField(max_length=255, null=True)
    public_key = models.TextField(null=True)
    claimant_url = models.CharField(max_length=255, null=True)
    idp = models.ForeignKey(IdentityProvider, null=True, on_delete=models.SET_NULL)
    status = models.IntegerField(
        choices=StatusOptions.choices, default=StatusOptions.INACTIVE
    )

    objects = models.Manager()  # MUST come first
    active = ActiveSwaManager()

    def public_key_as_jwk(self):
        from jwcrypto import jwk

        return jwk.JWK.from_pem(self.public_key.encode("utf-8"))


class Claimant(TimeStampedModel):
    class Meta:
        db_table = "claimants"

    idp = models.ForeignKey(IdentityProvider, on_delete=models.PROTECT)
    idp_user_xid = models.CharField(max_length=255, unique=True)


class Claim(TimeStampedModel):
    class Meta:
        db_table = "claims"

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    swa = models.ForeignKey(SWA, on_delete=models.PROTECT)
    claimant = models.ForeignKey(Claimant, on_delete=models.PROTECT)

    def payload_path(self):
        if self.is_complete():
            return self.completed_payload_path()
        else:
            return self.partial_payload_path()

    def completed_payload_path(self):
        return f"{self.swa.code}/{self.uuid}.json"

    def partial_payload_path(self):
        return f"{self.swa.code}/{self.uuid}.partial.json"

    def is_complete(self):
        return True  # TODO use events to determine
