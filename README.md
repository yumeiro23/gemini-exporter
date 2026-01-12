# Gemini Exporter

[中文](#中文) | [English](#english)

导出网页版Gemini对话到本地Markdown文件。也许支持ChatGPT。

代码和下面的README都是Gemini写的。

Export web-based Gemini conversations to local Markdown files. Potential support for ChatGPT.

Both the code and the following README were authored by Gemini.

![QQ图片20260112220338](https://github.com/user-attachments/assets/d1bdea21-f747-4c35-bf10-499a45877fc9)


---

## 中文

### 2.1 脚本用途与方法
**Gemini Exporter** 是一款浏览器用户脚本（UserScript），旨在解决大型语言模型（如 ChatGPT 和 Gemini）在导出长对话时常见的“内容不全”问题。

**主要功能：**
* **深度历史回溯**：针对现代 AI 网站采用的“虚拟列表”和“懒加载”技术，脚本通过模拟物理滚轮事件（WheelEvent）和步进式自动滚动，强制触发浏览器加载从对话开始至今的所有历史记录。
* **流式文本采集**：在回溯过程中实时捕获并清洗内容，防止因 DOM 节点回收导致的数据丢失。
* **智能格式转换**：自动处理数学公式（LaTeX）、代码块、有序及无序列表，并修复了常见的换行空格冗余问题。
* **自动命名**：自动识别当前对话的标题，并按照 Windows 10 文件命名规范清洗非法字符，作为导出文件的文件名。

### 2.2 安装步骤
1.  **安装脚本管理器**：
    在浏览器（Chrome, Edge, Firefox, Safari 等）中安装以下任一扩展：
    * [Tampermonkey (推荐)](https://www.tampermonkey.net/)
    * [Violentmonkey](https://violentmonkey.github.io/)
2.  **安装本项目脚本**：
    * [点击此处一键安装最新版本](https://raw.githubusercontent.com/yumeiro23/gemini-exporter/main/gemini-exporter.user.js)
    * 或者：点击仓库中的 `gemini-exporter.user.js` 文件，点击右上角的 **Raw** 按钮，在弹出的界面中点击“安装”。

### 2.3 致谢
本项目是在 **Elior** 编写的 [Export ChatGPT/Gemini/Grok conversations as Markdown](https://greasyfork.org/zh-CN/scripts/543471-export-chatgpt-gemini-grok-conversations-as-markdown) 脚本基础上，由 **Gemini** 进行深度重构与功能增强而成。

### 2.4 开源协议
本项目承袭原作者意愿，采用 [MIT](LICENSE) 协议。

---

## English

### 2.1 Purpose and Methods
**Gemini Exporter** is a browser userscript designed to solve the common issue of "incomplete content" when exporting long conversations from Large Language Models such as ChatGPT and Gemini.

**Key Features:**
* **Deep History Recovery**: Aimed at the "Virtual List" and "Lazy Loading" technologies used by modern AI websites, the script forces the browser to load the entire history from the beginning of the conversation by simulating physical wheel events (`WheelEvent`) and incremental auto-scrolling.
* **Streaming Content Capture**: Captures and cleanses content in real-time during the back-scrolling process to prevent data loss caused by DOM node recycling.
* **Intelligent Format Conversion**: Automatically handles mathematical formulas (LaTeX), code blocks, ordered and unordered lists, and fixes common issues like redundant leading spaces in user messages.
* **Automatic Naming**: Automatically identifies the title of the current conversation and cleans illegal characters according to Windows 10 file naming conventions to be used as the exported filename.

### 2.2 Installation
1.  **Install a Userscript Manager**:
    Install one of the following extensions in your browser:
    * [Tampermonkey (Recommended)](https://www.tampermonkey.net/)
    * [Violentmonkey](https://violentmonkey.github.io/)
2.  **Install this Script**:
    * [Click here to install the latest version](https://raw.githubusercontent.com/yumeiro23/gemini-exporter/main/gemini-exporter.user.js)
    * OR: Open `gemini-exporter.user.js` in this repo, click the **Raw** button, and then click "Install" in the manager tab.

### 2.3 Credits
This project is a deep reconstruction and enhancement of the script originally written by **Elior** ([Export ChatGPT/Gemini/Grok conversations as Markdown](https://greasyfork.org/zh-CN/scripts/543471-export-chatgpt-gemini-grok-conversations-as-markdown)), developed by **Gemini**.

### 2.4 License
In accordance with the original author's intentions, this project is licensed under the [MIT](LICENSE) License.
