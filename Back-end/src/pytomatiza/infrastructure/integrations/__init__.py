"""Integration infrastructure providers."""

from pytomatiza.infrastructure.integrations.discord_provider import DiscordProvider
from pytomatiza.infrastructure.integrations.telegram_provider import TelegramProvider
from pytomatiza.infrastructure.integrations.whatsapp_provider import WhatsAppProvider
from pytomatiza.infrastructure.integrations.facebook_provider import FacebookProvider
from pytomatiza.infrastructure.integrations.trello_provider import TrelloProvider
from pytomatiza.infrastructure.integrations.jira_provider import JiraProvider
from pytomatiza.infrastructure.integrations.google_drive_provider import GoogleDriveProvider
from pytomatiza.infrastructure.integrations.gmail_provider import GmailProvider

__all__ = [
    "DiscordProvider",
    "TelegramProvider",
    "WhatsAppProvider",
    "FacebookProvider",
    "TrelloProvider",
    "JiraProvider",
    "GoogleDriveProvider",
    "GmailProvider",
]
