# app.py
import os
import requests  # 导入requests库
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

# 加载 .env 文件中的环境变量 (例如 ECNU_API_KEY)
load_dotenv()

# --- 封装大模型调用 (使用 requests) ---
def call_llm_api(repo_data):
    """
    使用从前端接收到的仓库数据来构造一个 prompt，并直接通过 HTTP 请求调用大模型 API。

    参数:
    repo_data (dict): 包含仓库信息的字典。

    返回:
    str: 大模型生成的分析文本。
    """
    # 1. 获取 API Key 和 API Endpoint
    api_key = os.getenv("ECNU_API_KEY")
    api_url = "https://chat.ecnu.edu.cn/open/api/v1/chat/completions"
    # api_url = "https://api.deepseek.com/chat/completions"
    if not api_key:
        return "错误：ECNU_API_KEY 未设置。请在 .env 文件中配置您的 API 密钥。"

    # 2. 根据前端数据构造 Prompt
    prompt = f"""
    你是一名专业的开源项目分析师。请根据以下数据对 GitHub 仓库进行分析：
    - 仓库名称: {repo_data.get('repoName', '未知')}
    - OpenRank趋势: {repo_data.get('openrank', '未知')}
    - 贡献活跃度趋势: {repo_data.get('activity', '未知')}
    - 社区服务与支撑: {repo_data.get('participant', '未知')}
    - 用户欢迎度: {repo_data.get('attention', '未知')}

    请从以下几个方面给出你的分析报告：
    1. 项目健康度评估。
    2. 潜在的风险点。
    3. 给项目维护者的运营建议。

    请用中文回答，不要使用markdown的格式，直接纯文本输出。
    """

    # 3. 设置HTTP请求的 Headers
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key
    }

    # 4. 构造发送给API的JSON数据体 (Payload)
    payload = {
        "model": "ecnu-max",  # ECNU平台支持的模型名，按需调整
        "messages": [
            {"role": "system", "content": "你是一名顶级的开源项目分析师。"},
            {"role": "user", "content": prompt}
        ],
        "stream": False
        # "temperature": 0.7,
        # "max_tokens": 500
    }

    try:
        # 5. 使用 requests 发送 POST 请求
        response = requests.post(api_url, headers=headers, json=payload, timeout=30) # 设置30秒超时

        # 检查响应状态码，如果不是2xx，则会抛出HTTPError异常
        response.raise_for_status()

        # 6. 解析返回的JSON数据并提取结果
        response_json = response.json()
        # ECNU返回格式可能不同，需根据实际返回结构调整
        if "choices" in response_json:
            analysis_result = response_json["choices"][0]["message"]["content"]
        elif "data" in response_json and "choices" in response_json["data"]:
            analysis_result = response_json["data"]["choices"][0]["message"]["content"]
        else:
            analysis_result = str(response_json)
        return analysis_result.strip()

    except requests.exceptions.RequestException as e:
        # 处理网络请求相关的异常
        print(f"请求大模型API时发生网络错误: {e}")
        return f"调用大模型API时发生网络错误: {e}"
    except Exception as e:
        # 处理其他所有异常（如JSON解析失败、Key不存在等）
        print(f"调用大模型API时发生未知错误: {e}")
        return f"调用大模型API时发生未知错误: {e}"


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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)