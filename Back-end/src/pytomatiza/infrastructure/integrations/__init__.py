"""Integration infrastructure providers.

Individual Google service providers (Drive, Gmail, Calendar, Sheets, Meet)
are now unified in ``google_provider.py`` and re-exported here for backward
compatibility.
"""

from pytomatiza.infrastructure.integrations.discord_provider import DiscordProvider
from pytomatiza.infrastructure.integrations.telegram_provider import TelegramProvider
from pytomatiza.infrastructure.integrations.whatsapp_provider import WhatsAppProvider
from pytomatiza.infrastructure.integrations.facebook_provider import FacebookProvider
from pytomatiza.infrastructure.integrations.trello_provider import TrelloProvider
from pytomatiza.infrastructure.integrations.jira_provider import JiraProvider
from pytomatiza.infrastructure.integrations.google_provider import (
    GoogleCalendarProvider,
    GoogleDriveProvider,
    GoogleMeetProvider,
    GoogleProvider,
    GoogleSheetsProvider,
    GmailProvider,
)
from pytomatiza.infrastructure.integrations.maps_provider import GoogleMapsProvider
from pytomatiza.infrastructure.integrations.slack_provider import SlackProvider
from pytomatiza.infrastructure.integrations.zoom_provider import ZoomProvider

__all__ = [
    "DiscordProvider",
    "TelegramProvider",
    "WhatsAppProvider",
    "FacebookProvider",
    "TrelloProvider",
    "JiraProvider",
    "GoogleProvider",
    "GoogleDriveProvider",
    "GmailProvider",
    "GoogleCalendarProvider",
    "GoogleSheetsProvider",
    "GoogleMeetProvider",
    "GoogleMapsProvider",
    "SlackProvider",
    "ZoomProvider",
]
