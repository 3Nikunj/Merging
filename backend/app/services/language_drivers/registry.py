from app.services.language_drivers.base import BaseLanguageDriver
from app.services.language_drivers.python import PythonLanguageDriver
from app.services.language_drivers.javascript import JavaScriptLanguageDriver
from app.services.language_drivers.java import JavaLanguageDriver
from app.services.language_drivers.cpp import CppLanguageDriver
from app.services.language_drivers.c import CLanguageDriver

_REGISTRY: dict[str, BaseLanguageDriver] = {
    "python3": PythonLanguageDriver(),
    "python": PythonLanguageDriver(),
    "javascript": JavaScriptLanguageDriver(),
    "java": JavaLanguageDriver(),
    "cpp": CppLanguageDriver(),
    "c": CLanguageDriver(),
}

def get_driver(language: str) -> BaseLanguageDriver:
    """Look up and return the driver strategy for the specified language."""
    lang_key = language.strip().lower()
    driver = _REGISTRY.get(lang_key)
    if not driver:
        raise ValueError(f"Unsupported language: {language}")
    return driver
