import type { AssessmentAnswer } from "./path-planner";

export const ASSESSMENT_BANK_VERSION = "2026-05-31-v1";

export type AssessmentOption = {
  label: string;
  confidence: AssessmentAnswer["confidence"];
  knownConcepts?: string[];
  track?: AssessmentAnswer["track"];
};

export type AssessmentQuestion = {
  id: string;
  title: string;
  options: readonly AssessmentOption[];
};

export type ShuffledAssessmentQuestion = Omit<AssessmentQuestion, "options"> & {
  options: AssessmentOption[];
};

export function shuffleAssessmentOptions(
  sourceQuestions: readonly AssessmentQuestion[],
  random: () => number = Math.random
): ShuffledAssessmentQuestion[] {
  return sourceQuestions.map((question) => {
    const options = [...question.options];

    for (let index = options.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
    }

    return {
      id: question.id,
      title: question.title,
      options
    };
  });
}

export const assessmentQuestions = [
  {
    id: "python-identity",
    title: "你会怎么向别人解释 Python？",
    options: [
      {
        label: "解释型、动态强类型、跨平台的多范式语言",
        confidence: 3,
        knownConcepts: [
          "python-language",
          "interpreter-runtime",
          "dynamic-strong-typing",
          "programming-paradigms"
        ]
      },
      {
        label: "容易上手、生态很多的编程语言",
        confidence: 1,
        knownConcepts: ["python-language"]
      },
      { label: "只知道它叫 Python", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "type-model",
    title: "看到 x = '3' 后又写 x + 1，你会想到什么？",
    options: [
      {
        label: "变量能重新绑定，但 str 和 int 不能直接相加",
        confidence: 3,
        knownConcepts: ["variable", "dynamic-strong-typing", "primitive-types"]
      },
      {
        label: "可能需要先把字符串转成数字",
        confidence: 2,
        knownConcepts: ["type-casting", "primitive-types"]
      },
      { label: "应该会自动帮我算成 4", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "version-feature",
    title: "看到 match case 或 := 时，你第一反应是？",
    options: [
      {
        label: "要确认项目 Python 版本是否支持",
        confidence: 3,
        knownConcepts: ["python-versions", "match-case", "walrus-operator"]
      },
      {
        label: "知道这是比较新的语法，但不确定版本",
        confidence: 1,
        knownConcepts: ["python-versions"]
      },
      { label: "看起来像别的语言，不确定是什么", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "pep20-style",
    title: "一段代码能跑但绕来绕去，你会优先想什么？",
    options: [
      {
        label: "显式、简单、可读比炫技更重要",
        confidence: 3,
        knownConcepts: ["python-philosophy"]
      },
      {
        label: "能跑就先放着，之后再说",
        confidence: 1,
        knownConcepts: []
      },
      { label: "越短越好，最好一行写完", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "environment-runtime",
    title: "命令行能 import，编辑器里却 import 失败，你会查哪里？",
    options: [
      {
        label: "解释器、虚拟环境和 sys.path 是否一致",
        confidence: 3,
        knownConcepts: ["interpreter-runtime", "venv", "module-search-path"]
      },
      {
        label: "先重新 pip install 一遍",
        confidence: 1,
        knownConcepts: ["pip"]
      },
      { label: "不知道从哪里开始", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "string-formatting",
    title: "要输出 用户 Alice 有 3 条消息，你会怎么写？",
    options: [
      {
        label: "用 f-string 把变量直接放进字符串",
        confidence: 3,
        knownConcepts: ["string", "f-string"]
      },
      {
        label: "用 + 把几段字符串拼起来",
        confidence: 1,
        knownConcepts: ["string"]
      },
      { label: "还不清楚变量怎么放进文本", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "list-indexing",
    title: "拿到 scores = [80, 95, 72]，你想取第一个分数时会写？",
    options: [
      {
        label: "scores[0]",
        confidence: 3,
        knownConcepts: ["list"]
      },
      {
        label: "scores[1]",
        confidence: 1,
        knownConcepts: ["list"]
      },
      { label: "不知道列表怎么取元素", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "dict-lookup",
    title: "用户资料是 {'name': 'Ada', 'age': 36}，你会怎么取名字？",
    options: [
      {
        label: "profile['name'] 或 profile.get('name')",
        confidence: 3,
        knownConcepts: ["dict", "string"]
      },
      {
        label: "遍历所有值慢慢找",
        confidence: 1,
        knownConcepts: ["dict"]
      },
      { label: "会先把它改成列表", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "set-membership",
    title: "要判断一个邮箱是否在黑名单里，你会想到？",
    options: [
      {
        label: "用 set 做成员测试",
        confidence: 3,
        knownConcepts: ["set", "operators"]
      },
      {
        label: "用 list 也可以，先跑起来",
        confidence: 1,
        knownConcepts: ["list"]
      },
      { label: "不知道 in 是什么", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "range-loop",
    title: "看到 for i in range(10):",
    options: [
      {
        label: "能想到重复 10 次，i 从 0 到 9",
        confidence: 3,
        knownConcepts: ["for-loop", "range"]
      },
      {
        label: "大概见过但说不清边界",
        confidence: 1,
        knownConcepts: ["for-loop"]
      },
      { label: "完全陌生", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "branching",
    title: "输入为空就提示错误，不为空才继续处理，你会用？",
    options: [
      {
        label: "if / elif / else 表达分支",
        confidence: 3,
        knownConcepts: ["if-statement", "operators"]
      },
      {
        label: "写两个 print 先试试",
        confidence: 1,
        knownConcepts: []
      },
      { label: "不知道怎么让程序做选择", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "loop-control",
    title: "遍历文件时遇到空行跳过、找到目标就停，你会想到？",
    options: [
      {
        label: "continue 跳过，break 停止",
        confidence: 3,
        knownConcepts: ["for-loop", "break-continue-pass"]
      },
      {
        label: "用 if 包住大部分代码",
        confidence: 1,
        knownConcepts: ["if-statement"]
      },
      { label: "只能让循环完整跑完", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "function-model",
    title: "函数最像什么？",
    options: [
      {
        label: "有名字、有输入、有输出的可复用逻辑单元",
        confidence: 3,
        knownConcepts: ["function"]
      },
      {
        label: "一段被命名的代码",
        confidence: 1,
        knownConcepts: ["function"]
      },
      { label: "还没有概念", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "parameters",
    title: "看到 def clean(text, *, lower=True): 你会注意什么？",
    options: [
      {
        label: "text 是位置参数，lower 必须用关键字传",
        confidence: 3,
        knownConcepts: ["function", "function-parameters"]
      },
      {
        label: "知道这是函数参数，但不懂星号",
        confidence: 1,
        knownConcepts: ["function"]
      },
      { label: "不确定 def 后面在写什么", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "scope",
    title: "函数里改了变量，外面却没变，你会想到？",
    options: [
      {
        label: "名字查找和作用域边界",
        confidence: 3,
        knownConcepts: ["scope", "function"]
      },
      {
        label: "Python 有点随机",
        confidence: 0,
        knownConcepts: []
      },
      { label: "只知道可能和函数有关", confidence: 1, knownConcepts: ["function"] }
    ]
  },
  {
    id: "exceptions",
    title: "读取配置文件失败时，你希望程序能给出可控提示，会用？",
    options: [
      {
        label: "try-except 捕获预期异常",
        confidence: 3,
        knownConcepts: ["try-except"]
      },
      {
        label: "用 if 判断所有可能",
        confidence: 1,
        knownConcepts: ["if-statement"]
      },
      { label: "失败就让程序崩掉", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "raise-finally",
    title: "发现参数非法，并且无论成败都要关闭资源，你会想到？",
    options: [
      {
        label: "raise 表达非法状态，finally 负责收尾",
        confidence: 3,
        knownConcepts: ["raise-assert-finally", "try-except"]
      },
      {
        label: "只知道可以 print 一个错误",
        confidence: 1,
        knownConcepts: []
      },
      { label: "不知道怎么主动抛错", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "imports",
    title: "要使用标准库 json，你会怎么开始？",
    options: [
      {
        label: "import json，再调用 json.loads/json.dumps",
        confidence: 3,
        knownConcepts: ["import-syntax", "json"]
      },
      {
        label: "复制一段解析代码进来",
        confidence: 1,
        knownConcepts: []
      },
      { label: "不知道标准库怎么引入", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "modules-packages",
    title: "一个脚本开始拆成多个文件时，你会先考虑？",
    options: [
      {
        label: "模块、包结构和导入路径",
        confidence: 3,
        knownConcepts: ["module", "package-structure", "import-syntax"]
      },
      {
        label: "先复制函数到每个文件",
        confidence: 0,
        knownConcepts: []
      },
      { label: "知道要拆文件，但不确定 import 怎么写", confidence: 1, knownConcepts: ["module"] }
    ]
  },
  {
    id: "pathlib-files",
    title: "要批量处理某个目录下的 .txt 文件，你会想到？",
    options: [
      {
        label: "用 pathlib 的 Path.glob 遍历路径",
        confidence: 3,
        knownConcepts: ["pathlib", "for-loop"],
        track: "automation"
      },
      {
        label: "手写字符串拼路径",
        confidence: 1,
        knownConcepts: ["string"],
        track: "automation"
      },
      { label: "不知道怎么读目录", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "regex-text",
    title: "要从日志行里提取日期和状态码，你会想到？",
    options: [
      {
        label: "用 re/正则表达式描述文本模式",
        confidence: 3,
        knownConcepts: ["regular-expression", "string"],
        track: "data"
      },
      {
        label: "用 split 先粗略切开",
        confidence: 1,
        knownConcepts: ["string"],
        track: "data"
      },
      { label: "只能人工看", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "comprehension",
    title: "要把一组分数中过线的人名取出来，你会写？",
    options: [
      {
        label: "列表推导式表达过滤和转换",
        confidence: 3,
        knownConcepts: ["comprehension", "list", "if-statement"]
      },
      {
        label: "普通 for 循环 append",
        confidence: 2,
        knownConcepts: ["for-loop", "list"]
      },
      { label: "不知道怎么从列表生成新列表", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "lambda-key",
    title: "看到 sorted(users, key=lambda u: u['age'])，你会理解成？",
    options: [
      {
        label: "用匿名函数指定排序依据",
        confidence: 3,
        knownConcepts: ["lambda", "dict", "function"]
      },
      {
        label: "大概是在排序，但 lambda 不懂",
        confidence: 1,
        knownConcepts: ["dict"]
      },
      { label: "完全看不懂", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "class-object",
    title: "联系人有姓名、邮箱和格式化显示逻辑，你会考虑？",
    options: [
      {
        label: "用 class 把数据和行为放在一起",
        confidence: 3,
        knownConcepts: ["class", "encapsulation"]
      },
      {
        label: "用 dict 也能先保存数据",
        confidence: 1,
        knownConcepts: ["dict"]
      },
      { label: "所有字段分成多个列表", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "decorator-route",
    title: "看到 Flask 里的 @app.route('/login')，你会怎么理解？",
    options: [
      {
        label: "装饰器把函数注册成 URL 处理器",
        confidence: 3,
        knownConcepts: ["decorator", "function"],
        track: "web"
      },
      {
        label: "知道它和 Web 路由有关",
        confidence: 1,
        knownConcepts: [],
        track: "web"
      },
      { label: "以为 @ 是注释", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "type-annotations",
    title: "看到 def load(path: str) -> dict: 你会获得什么信息？",
    options: [
      {
        label: "参数和返回值的预期类型",
        confidence: 3,
        knownConcepts: ["type-annotations", "function-parameters"]
      },
      {
        label: "知道是提示，但不确定是否强制",
        confidence: 1,
        knownConcepts: ["type-annotations"]
      },
      { label: "以为这会自动转换类型", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "data-goal",
    title: "如果现在要做一个真实小项目，你最想先做什么？",
    options: [
      {
        label: "清洗 CSV、统计词频、生成报表",
        confidence: 1,
        knownConcepts: [],
        track: "data"
      },
      {
        label: "写接口、处理 JSON、做一个后端服务",
        confidence: 1,
        knownConcepts: [],
        track: "web"
      },
      {
        label: "批量整理文件、处理日志、自动化重复任务",
        confidence: 1,
        knownConcepts: [],
        track: "automation"
      }
    ]
  },
  {
    id: "automation-goal",
    title: "你更想让 Python 帮你省掉哪种重复劳动？",
    options: [
      {
        label: "按规则批量改名、移动和整理文件",
        confidence: 1,
        knownConcepts: [],
        track: "automation"
      },
      {
        label: "清洗一堆文本或表格字段",
        confidence: 1,
        knownConcepts: [],
        track: "data"
      },
      {
        label: "暂时还没有明确任务",
        confidence: 0,
        knownConcepts: []
      }
    ]
  },
  {
    id: "web-goal",
    title: "如果要写一个小型 API，你最担心哪一块？",
    options: [
      {
        label: "路由、JSON、异常和参数边界",
        confidence: 1,
        knownConcepts: [],
        track: "web"
      },
      {
        label: "环境安装和包管理",
        confidence: 1,
        knownConcepts: [],
        track: "web"
      },
      {
        label: "还不确定 API 是什么",
        confidence: 0,
        knownConcepts: []
      }
    ]
  },
  {
    id: "ai-goal",
    title: "如果以后进入 AI 工程，你觉得现在最该补什么？",
    options: [
      {
        label: "数据清洗、函数组织和类型边界",
        confidence: 1,
        knownConcepts: [],
        track: "ai"
      },
      {
        label: "先学会安装包和跑通示例",
        confidence: 1,
        knownConcepts: [],
        track: "ai"
      },
      {
        label: "直接开始调模型参数",
        confidence: 0,
        knownConcepts: []
      }
    ]
  }
] as const satisfies readonly AssessmentQuestion[];
