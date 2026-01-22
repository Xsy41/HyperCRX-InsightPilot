# app.py
import os
import json
import math
import statistics
import re
import requests  # 导入requests库
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from pathlib import Path

# 仅加载当前后端目录下的 .env，避免向上递归查找导致的权限问题
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

# --- DeepSeek (OpenAI-compatible) 调用封装 ---
# DeepSeek API 默认配置（可通过环境变量覆盖）
DEFAULT_DEEPSEEK_API_KEY = "sk-13268bc72ac34d64a2195ca5156e9576"
DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

def call_deepseek_chat(messages, model: str = "deepseek-chat"):
    """
    通过 DeepSeek OpenAI-compatible 接口调用大模型。

    环境变量（优先）：
      - DEEPSEEK_API_KEY: DeepSeek API Key
      - DEEPSEEK_API_URL: 可选，默认 https://api.deepseek.com/chat/completions
    
    如果环境变量未设置，将使用代码中的默认值。
    """
    api_key = os.getenv("DEEPSEEK_API_KEY") or DEFAULT_DEEPSEEK_API_KEY
    api_url = os.getenv("DEEPSEEK_API_URL") or DEFAULT_DEEPSEEK_API_URL
    if not api_key:
        return None, "错误：DEEPSEEK_API_KEY 未设置。"

    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "temperature": 0.4,
    }

    try:
        resp = requests.post(api_url, headers=headers, json=payload, timeout=45)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return (content or "").strip(), None
    except requests.exceptions.RequestException as e:
        print(f"请求 DeepSeek API 网络错误: {e}")
        return None, f"调用 DeepSeek API 网络错误: {e}"
    except Exception as e:
        print(f"解析 DeepSeek API 返回时发生错误: {e}")
        return None, f"解析 DeepSeek API 返回时发生错误: {e}"

# --- 封装大模型调用 (使用 DeepSeek API) ---
def call_llm_api(repo_data):
    """
    使用从前端接收到的仓库数据来构造一个 prompt，并调用 DeepSeek API 进行分析。

    参数:
    repo_data (dict): 包含仓库信息的字典。

    返回:
    str: 大模型生成的分析文本。
    """
    # 获取季度信息
    quarter = repo_data.get('quarter', '')
    prev_quarter = repo_data.get('prevQuarter', '')
    
    # 格式化数据为可读格式
    def format_data(data):
        if not data:
            return '无数据'
        if isinstance(data, dict):
            # 按月份排序
            sorted_items = sorted(data.items(), key=lambda x: x[0])
            return ', '.join([f"{k}: {v}" for k, v in sorted_items])
        return str(data)
    
    # 根据前端数据构造 Prompt
    quarter_context = f"本报告主要分析 {quarter} 的数据"
    if prev_quarter:
        quarter_context += f"，并与 {prev_quarter} 进行对比"
    
    prompt = f"""
你是一名专业的开源项目分析师。{quarter_context}（共6个月的数据）。

请根据以下数据对 GitHub 仓库进行深度分析：

    - 仓库名称: {repo_data.get('repoName', '未知')}
    - OpenRank趋势: {format_data(repo_data.get('openrank'))}
    - 贡献活跃度趋势: {format_data(repo_data.get('activity'))}
    - 社区服务与支撑: {format_data(repo_data.get('participant'))}
    - 用户欢迎度: {format_data(repo_data.get('attention'))}
    - Star数: {format_data(repo_data.get('stars'))}
    - Fork数: {format_data(repo_data.get('forks'))}
    - 贡献者数: {format_data(repo_data.get('contributor'))}

重要要求：
1. 主要基于 {quarter} 的数据进行分析
2. 可以与 {prev_quarter if prev_quarter else '上一期'} 进行对比，但不要过度依赖历史数据
3. 重点关注季度内的变化趋势和关键指标

请从以下几个方面给出你的分析报告（控制在 200-300 字）：
1. 项目健康度评估（基于季度数据）
2. 潜在的风险点（重点关注季度内的变化）
3. 给项目维护者的运营建议（针对季度表现）

请用中文回答，不要使用markdown的格式，直接纯文本输出。语气专业但通俗易懂。
"""

    # 使用 DeepSeek API
    messages = [
        {"role": "system", "content": "你是一名顶级的开源项目分析师，擅长从数据中提取洞察并给出可执行的建议。直接给出分析内容，不要使用开场白或引言。"},
        {"role": "user", "content": prompt}
    ]
    
    answer, err = call_deepseek_chat(messages)
    if err:
        return f"调用 AI 分析时发生错误: {err}"
    
    if not answer:
        return "无法生成分析报告，请稍后重试。"
    
    # 清理 AI 回答中的常见开场白
    cleaned_answer = answer.strip()
    # 移除常见的开场白模式
    patterns_to_remove = [
        r'^好的[，,]?\s*',
        r'^作为一名[^，,。]+[，,。]\s*',
        r'^我对[^，,。]+进行了[^，,。]+[，,。]\s*',
        r'^报告如下[：:]\s*',
        r'^根据[^，,。]+[，,。]\s*',
        r'^基于[^，,。]+[，,。]\s*',
    ]
    
    for pattern in patterns_to_remove:
        cleaned_answer = re.sub(pattern, '', cleaned_answer, flags=re.IGNORECASE)
    
    # 如果清理后为空，返回原答案
    if not cleaned_answer.strip():
        return answer.strip()
    
    return cleaned_answer.strip()


# --- 模版系统 ---
TEMPLATES_DIR = Path(__file__).parent / "templates"

def load_template(category: str, template_name: str):
    """加载模版文件"""
    template_path = TEMPLATES_DIR / category / f"{template_name}.json"
    if not template_path.exists():
        return None
    with open(template_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_trend_characteristics(data: list):
    """
    分析数据特征，返回用于模版路由的特征字典
    
    data: [["YYYY-MM", number], ...]
    返回: {
        "mean": float,  # 均值
        "variance": float,  # 方差
        "slope": float,  # 斜率（线性回归）
        "max": float,  # 最大值
        "min": float,  # 最小值
        "range": float,  # 范围
        "is_early_stage": bool,  # 是否早期（大部分值接近0）
        "trend_direction": str,  # "up" | "down" | "flat"
    }
    """
    if not data or len(data) < 2:
        return None
    
    values = [v for _, v in data]
    n = len(values)
    
    # 基本统计
    mean = statistics.mean(values) if values else 0
    # variance 需要至少2个数据点
    if len(values) > 1:
        try:
            variance = statistics.variance(values)
        except:
            variance = 0
    else:
        variance = 0
    max_val = max(values) if values else 0
    min_val = min(values) if values else 0
    range_val = max_val - min_val
    
    # 计算斜率（线性回归）
    x_centered = [i - (n - 1) / 2 for i in range(n)]
    y_centered = [v - mean for v in values]
    slope = sum(x * y for x, y in zip(x_centered, y_centered)) / sum(x * x for x in x_centered) if n > 1 else 0
    
    # 判断趋势方向
    first_half_mean = statistics.mean(values[:n//2]) if n >= 4 else values[0]
    second_half_mean = statistics.mean(values[n//2:]) if n >= 4 else values[-1]
    trend_direction = "up" if second_half_mean > first_half_mean * 1.1 else ("down" if second_half_mean < first_half_mean * 0.9 else "flat")
    
    # 判断是否早期阶段（大部分值接近0）
    non_zero_count = sum(1 for v in values if v > 0.1)
    is_early_stage = non_zero_count < n * 0.3  # 少于30%的数据点有值
    
    return {
        "mean": mean,
        "variance": variance,
        "slope": slope,
        "max": max_val,
        "min": min_val,
        "range": range_val,
        "is_early_stage": is_early_stage,
        "trend_direction": trend_direction,
    }

def route_openrank_template(characteristics: dict):
    """
    根据数据特征选择 OpenRank 模版
    
    路由规则：
    - early_stage: 早期阶段（大部分值接近0）
    - high_volatility: 高位波动（均值高且方差大）
    - stable_growth: 稳定增长（上升趋势且方差小）
    - trend_up: 上升趋势（上升但波动较大）
    - trend_down: 下降趋势
    - low_activity: 低活跃度（均值低且变化小）
    """
    if not characteristics:
        return "stable_growth"  # 默认
    
    mean = characteristics["mean"]
    variance = characteristics["variance"]
    slope = characteristics["slope"]
    is_early_stage = characteristics["is_early_stage"]
    trend_direction = characteristics["trend_direction"]
    
    # 早期阶段
    if is_early_stage:
        return "early_stage"
    
    # 下降趋势
    if trend_direction == "down":
        return "trend_down"
    
    # 高位波动：均值高（>阈值）且方差大
    if mean > 5 and variance > mean * 0.5:
        return "high_volatility"
    
    # 稳定增长：上升趋势且方差小
    if trend_direction == "up" and variance < mean * 0.3:
        return "stable_growth"
    
    # 上升趋势（但波动较大）
    if trend_direction == "up":
        return "trend_up"
    
    # 低活跃度：均值低且变化小
    if mean < 2 and variance < 1:
        return "low_activity"
    
    # 默认
    return "stable_growth"

def route_star_template(characteristics: dict, data: list):
    """
    根据数据特征选择 Star 模版
    
    路由规则（Star 是每月新增数量）：
    - event_driven: 事件驱动（有明显峰值，波动大）
    - high_growth: 高速增长（均值高且持续上升）
    - stable_growth: 稳定增长（上升趋势且方差小）
    - declining: 下降趋势
    - low_activity: 低活跃度（均值低且变化小）
    """
    if not characteristics or not data:
        return "stable_growth"  # 默认
    
    mean = characteristics["mean"]
    variance = characteristics["variance"]
    max_val = characteristics["max"]
    min_val = characteristics["min"]
    trend_direction = characteristics["trend_direction"]
    
    # 检测是否有明显峰值（事件驱动特征）
    values = [v for _, v in data]
    if len(values) >= 3:
        # 计算峰值：最大值是否显著高于均值（>2倍）
        if max_val > mean * 2 and max_val > 10:
            # 检查峰值是否孤立（前后值较低）
            max_idx = values.index(max_val)
            if max_idx > 0 and max_idx < len(values) - 1:
                prev_val = values[max_idx - 1]
                next_val = values[max_idx + 1]
                if max_val > prev_val * 1.5 and max_val > next_val * 1.5:
                    return "event_driven"
    
    # 下降趋势
    if trend_direction == "down":
        return "declining"
    
    # 高速增长：均值高且上升趋势
    if trend_direction == "up" and mean > 20:
        return "high_growth"
    
    # 稳定增长：上升趋势且方差小
    if trend_direction == "up" and variance < mean * 0.4:
        return "stable_growth"
    
    # 低活跃度：均值低且变化小
    if mean < 5 and variance < 3:
        return "low_activity"
    
    # 默认：如果有上升趋势但波动大，可能是事件驱动
    if trend_direction == "up" and variance > mean * 0.6:
        return "event_driven"
    
    # 默认
    return "stable_growth"

def format_curve_features(characteristics: dict, data: list):
    """格式化曲线特征描述"""
    if not characteristics:
        return "数据变化不明显"
    
    features = []
    
    if characteristics["is_early_stage"]:
        features.append("早期阶段，数值从接近零开始")
    
    if characteristics["trend_direction"] == "up":
        features.append("整体呈上升趋势")
    elif characteristics["trend_direction"] == "down":
        features.append("整体呈下降趋势")
    else:
        features.append("整体趋势相对平稳")
    
    if characteristics["variance"] > characteristics["mean"] * 0.5:
        features.append("波动幅度较大")
    elif characteristics["variance"] < characteristics["mean"] * 0.2:
        features.append("变化较为稳定")
    
    if data:
        max_val = max(v for _, v in data)
        min_val = min(v for _, v in data)
        if max_val > 0:
            features.append(f"数值范围：{min_val:.1f} - {max_val:.1f}")
    
    return "；".join(features) if features else "数据变化不明显"

# --- Flask 应用部分 (与之前版本相同) ---
app = Flask(__name__)
# 允许浏览器页面（如 github.com/gitee.com）直接请求本地后端
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/hello' , methods=['GET'])
def hello():
    return jsonify({"message": "Hello, World!"})


@app.route('/api/analyze', methods=['POST'])
def analyze_repository():
    if not request.is_json:
        return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

    data = request.get_json()

    if 'repoName' not in data:
        return jsonify({"error": "请求数据缺失，必须包含 'repoName'"}), 400

    analysis_report = call_llm_api(data)

    return jsonify({
        "repoName": data.get('repoName'),
        "analysisReport": analysis_report
    })

@app.route('/api/issue-trend-ai', methods=['POST'])
def issue_trend_ai():
    """
    Issue 趋势 AI 解读（DeepSeek）。
    请求 JSON:
      - repoName: string (可选)
      - data: {
          issuesOpened: [["YYYY-MM", number], ...],
          issuesClosed: [["YYYY-MM", number], ...],
          issueComments: [["YYYY-MM", number], ...]
        }
      - localSummary: string (可选，前端本地摘要作为参考/回退)
    返回：
      - {"summary": "..."} 或 {"error": "..."}
    """
    if not request.is_json:
        return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

    body = request.get_json() or {}
    repo_name = body.get("repoName") or ""
    payload = body.get("data") or {}
    local_summary = body.get("localSummary") or ""

    issues_opened = payload.get("issuesOpened") or []
    issues_closed = payload.get("issuesClosed") or []
    issue_comments = payload.get("issueComments") or []

    if not (issues_opened or issues_closed or issue_comments):
        return jsonify({"error": "缺少趋势数据 data（issuesOpened/issuesClosed/issueComments）"}), 400

    # 只保留最近 12 个月，避免 prompt 过长
    issues_opened = _take_last_n(issues_opened, 12)
    issues_closed = _take_last_n(issues_closed, 12)
    issue_comments = _take_last_n(issue_comments, 12)

    prompt = f"""
你是一名资深开源项目分析师。请根据最近若干个月的 Issue 趋势数据，输出一段中文"趋势解读"，用于在浏览器插件里展示。

要求：
1) 只输出纯文本，不要 markdown，不要列表符号，不要 emoji。
2) 重点回答：整体趋势（上升/下降/稳定）、新增 vs 关闭是否平衡、评论热度变化可能意味着什么、给维护者 1-2 条可执行建议。
3) 控制在 120-220 字之间，避免废话，语气专业但通俗。

仓库：{repo_name or "（未提供）"}

数据（按月）：
- issuesOpened: {issues_opened}
- issuesClosed: {issues_closed}
- issueComments: {issue_comments}

前端本地摘要（可参考，可能不准确）：{local_summary}
""".strip()

    messages = [
        {"role": "system", "content": "你是一名严谨的开源项目数据分析师。"},
        {"role": "user", "content": prompt},
    ]
    summary, err = call_deepseek_chat(messages)
    if err:
        return jsonify({"error": err}), 502
    return jsonify({"summary": summary})


@app.route('/api/activity-trend-ai', methods=['POST'])
def activity_trend_ai():
    """
    活跃度和 OpenRank 趋势 AI 解读（DeepSeek）。
    请求 JSON:
      - repoName: string (可选)
      - data: {
          data1: [["YYYY-MM", number], ...],  # 活跃度数据
          data2: [["YYYY-MM", number], ...]   # OpenRank 数据
        }
      - localSummary: string (可选，前端本地摘要作为参考/回退)
    返回：
      - {"summary": "..."} 或 {"error": "..."}
    """
    if not request.is_json:
        return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

    body = request.get_json() or {}
    repo_name = body.get("repoName") or ""
    payload = body.get("data") or {}
    local_summary = body.get("localSummary") or ""

    activity_data = payload.get("data1") or []
    openrank_data = payload.get("data2") or []

    if not (activity_data or openrank_data):
        return jsonify({"error": "缺少趋势数据 data（data1/data2）"}), 400

    # 只保留最近 12 个月，避免 prompt 过长
    activity_data = _take_last_n(activity_data, 12)
    openrank_data = _take_last_n(openrank_data, 12)

    prompt = f"""
你是一名资深开源项目分析师。请根据最近若干个月的活跃度和 OpenRank 趋势数据，输出一段中文"趋势解读"，用于在浏览器插件里展示。

要求：
1) 只输出纯文本，不要 markdown，不要列表符号，不要 emoji。
2) 重点回答：活跃度趋势（上升/下降/稳定）、OpenRank 趋势变化、两者的相关性分析、给维护者 1-2 条可执行建议。
3) 控制在 120-220 字之间，避免废话，语气专业但通俗。

仓库：{repo_name or "（未提供）"}

数据（按月）：
- 活跃度: {activity_data}
- OpenRank: {openrank_data}

前端本地摘要（可参考，可能不准确）：{local_summary}
""".strip()

    messages = [
        {"role": "system", "content": "你是一名严谨的开源项目数据分析师。"},
        {"role": "user", "content": prompt},
    ]
    summary, err = call_deepseek_chat(messages)
    if err:
        return jsonify({"error": err}), 502
    return jsonify({"summary": summary})


def _take_last_n(data_list, n):
    return data_list[-n:] if len(data_list) > n else data_list


def _trend(series):
    # series: list of ["YYYY-MM", number]
    recent = [v for (_, v) in _take_last_n(series or [], 6)]
    if len(recent) < 2:
        return {"dir": "flat", "change": 0, "pct": 0}
    first, last = recent[0], recent[-1]
    change = last - first
    pct = 0 if first == 0 else change / first
    dir_ = "up" if pct > 0.2 else ("down" if pct < -0.2 else "flat")
    return {"dir": dir_, "change": round(change), "pct": int(round(pct * 100)), "last": last}


@app.route('/api/report', methods=['POST'])
def issue_report():
    """
    生成基于 issue 指标的数据报告。
    请求体 JSON 格式：
      - apiUrl: 可选，后端将从该 URL 拉取 JSON 数据
      - data: 可选，直接传数据，结构需包含 issuesOpened/issuesClosed/issueComments 数组
        每个数组元素形如 ["YYYY-MM", number]
    优先使用 data，其次使用 apiUrl。
    返回：{"summary": "..."}
    """
    if not request.is_json:
        return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

    body = request.get_json() or {}
    payload = body.get("data")
    api_url = body.get("apiUrl")

    if payload is None and api_url:
        try:
            r = requests.get(api_url, timeout=20)
            r.raise_for_status()
            payload = r.json()
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"拉取 apiUrl 失败: {e}"}), 502
        except ValueError:
            return jsonify({"error": "apiUrl 返回的不是有效 JSON"}), 502

    if not payload:
        return jsonify({"error": "缺少数据，请提供 data 或 apiUrl"}), 400

    issues_opened = payload.get("issuesOpened") or []
    issues_closed = payload.get("issuesClosed") or []
    issue_comments = payload.get("issueComments") or []

    o = _trend(issues_opened)
    c = _trend(issues_closed)
    m = _trend(issue_comments)

    def _last_month():
        for arr in (issues_opened, issues_closed, issue_comments):
            if arr:
                return arr[-1][0]
        return ""

    opened_last = issues_opened[-1][1] if issues_opened else 0
    closed_last = issues_closed[-1][1] if issues_closed else 0

    pair_state = (
        "基本持平"
        if (max(opened_last, closed_last) or 1) and abs(opened_last - closed_last) / (max(opened_last, closed_last) or 1) <= 0.1
        else ("新增高于关闭" if opened_last > closed_last else "关闭高于新增")
    )
    overall_state = (
        "稳定状态"
        if o["dir"] == c["dir"] == "flat"
        else ("同步上升" if o["dir"] == c["dir"] == "up" else ("同步下降" if o["dir"] == c["dir"] == "down" else "阶段性波动"))
    )
    comment_tone = (
        "评论数下降显著，或意味着项目讨论减少、维护节奏趋缓。"
        if m["dir"] == "down"
        else ("评论数上升显著，或意味着社区互动更活跃、需求反馈增多。" if m["dir"] == "up" else "评论数基本稳定。")
    )

    last_month = _last_month()
    summary = f"系统观察到过去6个月（截至 {last_month}），Issue 的创建与关闭数量{pair_state}，整体处于{overall_state}。{comment_tone}"

    return jsonify({"summary": summary})


@app.route('/api/oss-gpt-chat', methods=['POST'])
def oss_gpt_chat():
    """
    OSS GPT 聊天接口（使用 DeepSeek API）。
    请求 JSON:
      - question: string (用户问题)
      - history: [string, string] (可选，对话历史 [用户消息, AI回复])
      - repoName: string (可选，仓库名称，用于上下文)
      - activeDocs: string (可选，文档名称，用于上下文)
    返回：
      - {"answer": "..."} 或 {"error": "..."}
    """
    if not request.is_json:
        return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

    body = request.get_json() or {}
    question = body.get("question", "").strip()
    history = body.get("history") or ["", ""]
    repo_name = body.get("repoName") or ""
    active_docs = body.get("activeDocs") or ""

    if not question:
        return jsonify({"error": "缺少 question 参数"}), 400

    # 构建对话历史（如果有）
    messages = [
        {
            "role": "system",
            "content": f"""你是一个专业的开源项目文档问答助手。你擅长回答关于开源项目的问题，特别是关于 {repo_name or "开源项目"} 的问题。
{f"当前文档上下文：{active_docs}" if active_docs else ""}
请用中文回答，回答要准确、简洁、有帮助。""",
        }
    ]

    # 如果有历史对话，添加到 messages
    if history[0] and history[1]:
        messages.append({"role": "user", "content": history[0]})
        messages.append({"role": "assistant", "content": history[1]})

    # 添加当前问题
    messages.append({"role": "user", "content": question})

    answer, err = call_deepseek_chat(messages)
    if err:
        return jsonify({"error": err}), 502
    return jsonify({"answer": answer})


@app.route('/api/openrank-ai', methods=['POST'])
def openrank_ai():
    """
    OpenRank 趋势 AI 解读（基于模版系统）。
    请求 JSON:
      - repoName: string (可选)
      - data: [["YYYY-MM", number], ...]  # OpenRank 数据
    返回：
      - {"summary": "...", "template": "...", "characteristics": {...}} 或 {"error": "..."}
    """
    try:
        if not request.is_json:
            return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

        body = request.get_json() or {}
        repo_name = body.get("repoName") or ""
        data = body.get("data") or []

        print(f"[OpenRank AI] 收到请求，数据长度: {len(data)}")

        if not data:
            return jsonify({"error": "缺少 OpenRank 数据"}), 400

        # 只保留最近 12 个月，避免 prompt 过长
        if len(data) > 12:
            data = data[-12:]

        # 分析数据特征
        characteristics = analyze_trend_characteristics(data)
        print(f"[OpenRank AI] 数据特征: {characteristics}")
        
        # 路由到合适的模版
        template_name = route_openrank_template(characteristics)
        print(f"[OpenRank AI] 选择的模版: {template_name}")
        template = load_template("openrank", template_name)
        
        if not template:
            print(f"[OpenRank AI] 错误: 模版 {template_name} 不存在")
            return jsonify({"error": f"模版 {template_name} 不存在"}), 500

        # 准备模版变量
        if data:
            time_range = f"{data[0][0]} 至 {data[-1][0]}"
            months = len(data)
            curve_features = format_curve_features(characteristics, data)
            # 提供完整数据列表，让 AI 基于实际数据解读
            data_details = "\n".join([f"  {month}: {value:.2f}" for month, value in data])
            # 最近6个月的数据（用于数据确认部分）
            recent_6_months = data[-6:] if len(data) >= 6 else data
            recent_summary = "\n".join([f"  {month}: {value:.2f}" for month, value in recent_6_months])
        else:
            time_range = "未知"
            months = 0
            curve_features = "无数据"
            data_details = "无数据"
            recent_summary = "无数据"

        # 填充模版
        user_prompt = template["user_prompt_template"].format(
            time_range=time_range,
            months=months,
            curve_features=curve_features,
            data_details=data_details,
            recent_summary=recent_summary
        )

        # 调用 AI
        messages = [
            {"role": "system", "content": template["system_prompt"]},
            {"role": "user", "content": user_prompt}
        ]
        
        print(f"[OpenRank AI] 调用 DeepSeek API...")
        answer, err = call_deepseek_chat(messages)
        if err:
            print(f"[OpenRank AI] DeepSeek API 错误: {err}")
            return jsonify({"error": err}), 502
        
        print(f"[OpenRank AI] 生成成功，长度: {len(answer) if answer else 0}")
        return jsonify({
            "summary": answer,
            "template": template_name,
            "template_display_name": template.get("display_name", template_name),
            "characteristics": characteristics
        })
    except Exception as e:
        print(f"[OpenRank AI] 异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"服务器内部错误: {str(e)}"}), 500


@app.route('/api/star-ai', methods=['POST'])
def star_ai():
    """
    Star 趋势 AI 解读（基于模版系统）。
    请求 JSON:
      - repoName: string (可选)
      - data: [["YYYY-MM", number], ...]  # Star 数据（每月新增数量）
    返回：
      - {"summary": "...", "template": "...", "characteristics": {...}} 或 {"error": "..."}
    """
    try:
        if not request.is_json:
            return jsonify({"error": "请求格式错误，需要为 application/json"}), 400

        body = request.get_json() or {}
        repo_name = body.get("repoName") or ""
        data = body.get("data") or []

        print(f"[Star AI] 收到请求，数据长度: {len(data)}")

        if not data:
            return jsonify({"error": "缺少 Star 数据"}), 400

        # 只保留最近 12 个月，避免 prompt 过长
        if len(data) > 12:
            data = data[-12:]

        # 分析数据特征
        characteristics = analyze_trend_characteristics(data)
        print(f"[Star AI] 数据特征: {characteristics}")
        
        # 路由到合适的模版
        template_name = route_star_template(characteristics, data)
        print(f"[Star AI] 选择的模版: {template_name}")
        template = load_template("star", template_name)
        
        if not template:
            print(f"[Star AI] 错误: 模版 {template_name} 不存在")
            return jsonify({"error": f"模版 {template_name} 不存在"}), 500

        # 准备模版变量
        if data:
            time_range = f"{data[0][0]} 至 {data[-1][0]}"
            months = len(data)
            curve_features = format_curve_features(characteristics, data)
            # 提供完整数据列表，让 AI 基于实际数据解读
            data_details = "\n".join([f"  {month}: {value:.2f}" for month, value in data])
            # 最近6个月的数据（用于数据确认部分）
            recent_6_months = data[-6:] if len(data) >= 6 else data
            recent_summary = "\n".join([f"  {month}: {value:.2f}" for month, value in recent_6_months])
        else:
            time_range = "未知"
            months = 0
            curve_features = "无数据"
            data_details = "无数据"
            recent_summary = "无数据"

        # 填充模版
        user_prompt = template["user_prompt_template"].format(
            time_range=time_range,
            months=months,
            curve_features=curve_features,
            data_details=data_details,
            recent_summary=recent_summary
        )

        # 调用 AI
        messages = [
            {"role": "system", "content": template["system_prompt"]},
            {"role": "user", "content": user_prompt}
        ]
        
        print(f"[Star AI] 调用 DeepSeek API...")
        answer, err = call_deepseek_chat(messages)
        if err:
            print(f"[Star AI] DeepSeek API 错误: {err}")
            return jsonify({"error": err}), 502
        
        print(f"[Star AI] 生成成功，长度: {len(answer) if answer else 0}")
        return jsonify({
            "summary": answer,
            "template": template_name,
            "template_display_name": template.get("display_name", template_name),
            "characteristics": characteristics
        })
    except Exception as e:
        print(f"[Star AI] 异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"服务器内部错误: {str(e)}"}), 500


if __name__ == '__main__':
    # 关闭 debug/reloader，避免某些环境下的权限问题
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)