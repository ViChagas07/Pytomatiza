"""Integration infrastructure providers."""

from pytomatiza.infrastructure.integrations.discord_provider import DiscordProvider
from pytomatiza.infrastructure.integrations.telegram_provider import TelegramProvider
from pytomatiza.infrastructure.integrations.whatsapp_provider import WhatsAppProvider
from pytomatiza.infrastructure.integrations.facebook_provider import FacebookProvider
from pytomatiza.infrastructure.integrations.trello_provider import TrelloProvider
from pytomatiza.infrastructure.integrations.jira_provider import JiraProvider
from pytomatiza.infrastructure.integrations.google_drive_provider import GoogleDriveProvider
from pytomatiza.infrastructure.integrations.gmail_provider import GmailProvider
from pytomatiza.infrastructure.integrations.calendar_provider import GoogleCalendarProvider
from pytomatiza.infrastructure.integrations.sheets_provider import GoogleSheetsProvider
from pytomatiza.infrastructure.integrations.google_meet_provider import GoogleMeetProvider
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
    "GoogleDriveProvider",
    "GmailProvider",
    "GoogleCalendarProvider",
    "GoogleSheetsProvider",
    "GoogleMeetProvider",
    "GoogleMapsProvider",
    "SlackProvider",
    "ZoomProvider",
]
