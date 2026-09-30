"""Integration infrastructure providers.

Individual Google service providers (Drive, Gmail, Calendar, Sheets, Meet)
are now unified in ``google_provider.py`` and re-exported here for backward
compatibility.

Mock providers for local development are in ``mock_providers.py``.
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
from pytomatiza.infrastructure.integrations.mock_providers import (
    get_mock_provider,
    list_mock_providers,
    MockSlackProvider,
    MockJiraProvider,
    MockDiscordProvider,
    MockTrelloProvider,
    MockZoomProvider,
    MockGoogleDriveProvider,
    MockGmailProvider,
    MockWhatsAppProvider,
    MockTelegramProvider,
)

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
    # Mock providers
    "get_mock_provider",
    "list_mock_providers",
    "MockSlackProvider",
    "MockJiraProvider",
    "MockDiscordProvider",
    "MockTrelloProvider",
    "MockZoomProvider",
    "MockGoogleDriveProvider",
    "MockGmailProvider",
    "MockWhatsAppProvider",
    "MockTelegramProvider",
]
