"""
LLM configuration manager.

Configuration precedence:
1. Built-in defaults
2. .env.local values as machine-level defaults
3. User-saved settings from ai_config.json

This lets local env config keep the app usable out of the box while still
allowing the model configuration dialog to override settings per login user.
"""
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'ai_config.json')
ENV_PATH = os.path.join(os.path.dirname(__file__), '.env.local')

DEFAULT_CONFIG = {
    'api_key': '',
    'base_url': 'https://api.deepseek.com/v1',
    'model': 'deepseek-chat',
    'enabled': False,
}

CONFIG_KEYS = set(DEFAULT_CONFIG.keys())


def _read_env_local():
    config = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    return config


def _env_config():
    env = _read_env_local()
    config = {}
    if env.get('AI_API_KEY'):
        config['api_key'] = env['AI_API_KEY']
    if env.get('AI_BASE_URL'):
        config['base_url'] = env['AI_BASE_URL']
    if env.get('AI_MODEL'):
        config['model'] = env['AI_MODEL']
    if env.get('AI_ENABLED'):
        config['enabled'] = env['AI_ENABLED'].lower() in ('true', '1', 'yes')
    return config


def _empty_store():
    return {'default': DEFAULT_CONFIG.copy(), 'users': {}}


def _read_json_store():
    if not os.path.exists(CONFIG_PATH):
        return _empty_store()

    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    if any(key in raw for key in CONFIG_KEYS):
        legacy = {key: raw.get(key, DEFAULT_CONFIG[key]) for key in CONFIG_KEYS}
        return {'default': {**DEFAULT_CONFIG, **legacy}, 'users': {}}

    default_config = {**DEFAULT_CONFIG, **raw.get('default', {})}
    users = raw.get('users', {}) if isinstance(raw.get('users', {}), dict) else {}
    normalized_users = {
        str(user_id): {**default_config, **user_config}
        for user_id, user_config in users.items()
        if isinstance(user_config, dict)
    }
    return {'default': default_config, 'users': normalized_users}


def _write_json_store(store):
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(store, f, ensure_ascii=False, indent=2)


def load_config(user_id=None):
    store = _read_json_store()
    config = DEFAULT_CONFIG.copy()
    config.update(store['default'])
    config.update(_env_config())

    if user_id is not None:
        config.update(store['users'].get(str(user_id), {}))

    return config


def save_config(data, user_id=None):
    store = _read_json_store()
    user_key = str(user_id) if user_id is not None else None

    # Start from the effective config so an empty API key keeps the current key,
    # including one inherited from .env.local.
    target = load_config(user_id)
    if user_key is not None:
        target.update(store['users'].get(user_key, {}))

    for key in CONFIG_KEYS:
        if key not in data:
            continue
        if key == 'api_key' and data[key] == '':
            continue
        target[key] = data[key]

    if user_key is None:
        store['default'] = {**DEFAULT_CONFIG, **target}
    else:
        store['users'][user_key] = {**DEFAULT_CONFIG, **target}

    _write_json_store(store)
    return target


def get_config_status(user_id=None):
    config = load_config(user_id)
    key = config.get('api_key', '')
    store = _read_json_store()
    has_user_config = user_id is not None and str(user_id) in store['users']
    has_env_config = bool(_env_config())
    return {
        'has_key': bool(key),
        'key_preview': f'{key[:8]}...{key[-4:]}' if len(key) > 12 else ('***' if key else ''),
        'base_url': config.get('base_url', ''),
        'model': config.get('model', ''),
        'enabled': config.get('enabled', False),
        'source': 'user' if has_user_config else ('.env.local' if has_env_config else 'default'),
    }
