"""
Entry point for Google ADK CLI.

Usage:
    adk web       # Launch ADK web UI
    adk run       # Run in terminal
    adk api_server  # Run as API server
"""

from app.agents import root_agent  # noqa: F401
