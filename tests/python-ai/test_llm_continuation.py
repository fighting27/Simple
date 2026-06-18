import os
import sys


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PYTHON_AI = os.path.join(ROOT, 'python-ai')
if PYTHON_AI not in sys.path:
    sys.path.insert(0, PYTHON_AI)

import analyzer


class MonkeyPatch:
    def __init__(self):
        self._undo = []

    def setattr(self, obj, name, value):
        old = getattr(obj, name)
        self._undo.append(lambda: setattr(obj, name, old))
        setattr(obj, name, value)

    def setitem(self, mapping, key, value):
        old = mapping.get(key)
        existed = key in mapping

        def restore():
            if existed:
                mapping[key] = old
            else:
                mapping.pop(key, None)

        self._undo.append(restore)
        mapping[key] = value

    def undo(self):
        for restore in reversed(self._undo):
            restore()


def test_llm_analysis_continues_when_model_hits_token_limit(monkeypatch):
    calls = []

    def fake_load_config(user_id=None):
        return {
            'api_key': 'test-key',
            'enabled': True,
            'model': 'test-model',
            'base_url': 'https://example.com/v1',
        }

    def fake_call_llm(system_prompt, user_prompt, **kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            return {
                'content': '【本月结论】内容开始。\n【风险提醒】6月16日有一',
                'finish_reason': 'length',
            }
        return {
            'content': '笔集中餐饮支出，建议下周控制外食次数。\n【下周关注】关注餐饮预算。',
            'finish_reason': 'stop',
        }

    monkeypatch.setattr(analyzer, '_build_finance_context', lambda *args, **kwargs: (
        {'this_month': {'expense': 100}},
        {'predicted_total': 120},
        [],
        {'anomalies': []},
        '测试账目上下文',
    ))
    monkeypatch.setitem(sys.modules, 'llm_client', type('M', (), {'call_llm': fake_call_llm}))
    monkeypatch.setitem(sys.modules, 'ai_config_manager', type('M', (), {'load_config': fake_load_config}))

    result = analyzer.llm_analysis(user_id=1)

    assert result['llm_summary'].endswith('【下周关注】关注餐饮预算。')
    assert '6月16日有一笔集中餐饮支出' in result['llm_summary']
    assert calls[0]['max_tokens'] >= 1200
    assert calls[0]['return_metadata'] is True
    assert len(calls) == 2


if __name__ == '__main__':
    patcher = MonkeyPatch()
    try:
        test_llm_analysis_continues_when_model_hits_token_limit(patcher)
        print('llm continuation tests passed')
    finally:
        patcher.undo()
