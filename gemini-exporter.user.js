// ==UserScript==
// @name         Export AI Chat to Markdown (Refined by Gemini)
// @namespace    https://github.com/yumeiro23/gemini-exporter
// @version      1.3.8
// @author       Elior & Gemini
// @description  Export ChatGPT/Gemini conversations to Markdown with deep history recovery.
// @description:zh-CN 将 ChatGPT/Gemini 对话导出为 Markdown，支持深度历史回溯。
// @match        *://chatgpt.com/*
// @match        *://gemini.google.com/*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0...（保留原图标数据）
// @grant        GM_addStyle
// @license      MIT
// @run-at       document-idle
// @noframes
// ==/UserScript==

/*
 * This script is a modified version based on the work of Elior.
 * Original script: https://greasyfork.org/zh-CN/scripts/543471
 * Modified by Gemini to improve history loading and formatting.
 */

(function () {
    'use strict';

    const CommonUtil = {
        addStyle: function(id, style) {
            if (document.getElementById(id)) return;
            const styleEl = document.createElement('style');
            styleEl.id = id;
            styleEl.textContent = style;
            document.head.appendChild(styleEl);
        },
        createElement: function(tag, options = {}) {
            const element = document.createElement(tag);
            if (options.text) element.textContent = options.text;
            if (options.id) element.id = options.id;
            if (options.className) element.className = options.className;
            if (options.childrens) {
                options.childrens.forEach((child) => element.appendChild(child));
            }
            return element;
        }
    };

    const HtmlToMarkdown = {
        to: function(element, isUser = false) {
            if (!element) return "";
            const clone = element.cloneNode(true);

            // 1. 处理数学公式
            clone.querySelectorAll('.math-block, .math-inline').forEach(el => {
                const latex = el.getAttribute('data-math');
                if (latex) {
                    const wrapper = el.classList.contains('math-block') ? `\n$$\n${latex}\n$$\n` : `$${latex}$`;
                    el.replaceWith(wrapper);
                }
            });

            clone.querySelectorAll('annotation[encoding="application/x-tex"]').forEach(el => {
                const latex = el.textContent.trim();
                el.replaceWith(el.closest(".katex-display") ? `\n$$\n${latex}\n$$\n` : `$${latex}$`);
            });

            // 2. 清理干扰元素
            clone.querySelectorAll(".katex-html, button, .sr-only, mat-progress-bar, .code-block-decoration, .hide-wrapper").forEach(el => el.remove());

            // 3. 代码块转换
            clone.querySelectorAll("pre, code-block").forEach(pre => {
                const lang = pre.querySelector("span")?.textContent || "";
                const code = pre.querySelector("code, pre")?.innerText || pre.innerText;
                pre.replaceWith(`\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`);
            });

            // 4. 重点修复：列表处理 (优先处理有序和无序容器)
            clone.querySelectorAll("ol").forEach(ol => {
                let listContent = "";
                const items = ol.querySelectorAll(":scope > li");
                items.forEach((li, idx) => {
                    // 提取内容并移除内部可能导致意外换行的多余空白
                    let content = li.innerText.trim();
                    listContent += `${idx + 1}. ${content}\n`;
                });
                ol.replaceWith("\n" + listContent + "\n");
            });

            clone.querySelectorAll("ul").forEach(ul => {
                let listContent = "";
                const items = ul.querySelectorAll(":scope > li");
                items.forEach(li => {
                    let content = li.innerText.trim();
                    listContent += `- ${content}\n`;
                });
                ul.replaceWith("\n" + listContent + "\n");
            });

            // 5. 基础标签格式化 (处理剩下的 li 以防万一)
            clone.querySelectorAll("h1,h2,h3").forEach(h => h.replaceWith(`\n### ${h.textContent}\n`));
            clone.querySelectorAll("strong, b").forEach(b => b.replaceWith(`**${b.textContent}**`));
            clone.querySelectorAll("p").forEach(p => p.replaceWith(`\n${p.textContent}\n`));

            // 6. 提取纯文本
            let text = clone.innerText || clone.textContent;

            // 7. 用户消息行首去噪
            if (isUser) {
                text = text.split('\n').map(line => line.trimStart()).join('\n');
            }

            return text.replace(/\n{3,}/g, '\n\n').trim();
        }
    };

    const Chat = {
        getPlatform: function() {
            const host = window.location.hostname;
            if (host.includes("chatgpt")) return "chatGPT";
            if (host.includes("gemini")) return "gemini";
            return "other";
        },

        // 获取并清洗当前对话标题作为文件名
        getChatTitle: function(platform) {
            let title = "";
            try {
                if (platform === "chatGPT") {
                    const activeChat = document.querySelector('nav li div[aria-current="page"]') ||
                                     document.querySelector('nav li div[class*="bg-token-sidebar"]');
                    title = activeChat?.innerText;
                } else if (platform === "gemini") {
                    title = document.querySelector('conversations-list .selected .conversation-title')?.innerText ||
                            document.querySelector('conversations-list div.selected')?.innerText;
                }

                if (!title || title.length < 2) {
                    title = document.title
                        .replace(/ - ChatGPT$/i, "").replace(/ - Gemini$/i, "")
                        .replace(/^ChatGPT - /i, "").replace(/^Gemini - /i, "");
                }
            } catch (e) {}
            // Win10 合规化：过滤 \ / : * ? " < > | 并合并空格
            return title.replace(/[<>:"/\\|?*\x00-\x1f\r\n]/g, "_").replace(/\s+/g, " ").trim() || "Chat_Export";
        },

        findScroller: function(platform) {
            if (platform === "chatGPT") return document.querySelector('div[class*="react-scroll-to-bottom"] > div') || document.querySelector('main div.overflow-y-auto');
            if (platform === "gemini") return document.querySelector('infinite-scroller.chat-history') || document.querySelector('main mat-sidenav-content');
            return window;
        },

        prepareFullHistory: async function(scroller, btnTextNode) {
            if (!scroller || scroller === window) return;
            let lastHeight = scroller.scrollHeight;
            let noChangeRounds = 0;
            const MAX_ROUNDS = 60;

            for (let i = 0; i < MAX_ROUNDS; i++) {
                btnTextNode.textContent = `🔍 正在回溯加载 (${i+1})...`;
                scroller.scrollTop = 0;
                scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
                await new Promise(r => setTimeout(r, 1200));

                const currentHeight = scroller.scrollHeight;
                if (currentHeight === lastHeight) {
                    noChangeRounds++;
                    if (noChangeRounds >= 3) break;
                } else {
                    lastHeight = currentHeight;
                    noChangeRounds = 0;
                }
            }
        },

        exportChat: async function(btnTextNode) {
            const platform = this.getPlatform();
            const scroller = this.findScroller(platform);
            const originalText = btnTextNode.textContent;

            try {
                await this.prepareFullHistory(scroller, btnTextNode);

                btnTextNode.textContent = "📝 正在构建文档...";
                await new Promise(r => setTimeout(r, 500));

                let messages = [];
                if (platform === "chatGPT") {
                    messages = Array.from(document.querySelectorAll('div[data-message-id], article'));
                } else if (platform === "gemini") {
                    messages = Array.from(document.querySelectorAll('user-query, model-response, .question-block, ucs-summary'));
                }

                const chatTitle = this.getChatTitle(platform);
                let md = `# Conversation: ${chatTitle}\n\n---\n\n`;

                messages.forEach((el) => {
                    if (el.id === 'custom-export-btn-2025' || el.innerText.length < 1) return;

                    const isUser = platform === "chatGPT" ? el.getAttribute('data-message-author-role') === 'user' :
                                   (el.tagName.toLowerCase() === 'user-query' || el.classList.contains('question-block'));

                    const content = HtmlToMarkdown.to(el, isUser);
                    if (content) {
                        md += `## ${isUser ? 'User' : 'Assistant'}\n\n${content}\n\n---\n\n`;
                    }
                });

                const blob = new Blob([md], { type: "text/markdown" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${chatTitle}.md`;
                a.click();
                URL.revokeObjectURL(a.href);

            } catch (err) {
                console.error(err);
                alert("导出异常，请尝试手动滑到顶部后再试。");
            } finally {
                btnTextNode.textContent = originalText;
            }
        }
    };

    const ExportUI = {
        btnId: 'custom-export-btn-2025',
        inject: function() {
            if (document.getElementById(this.btnId)) return;

            CommonUtil.addStyle('export-btn-style', `
                #${this.btnId} {
                    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                    z-index: 2147483647; background: #000; color: #fff;
                    padding: 8px 24px; border-radius: 30px; cursor: pointer;
                    display: flex; align-items: center; font-size: 13px; font-weight: 500;
                    border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    font-family: system-ui, sans-serif; transition: all 0.2s;
                }
                #${this.btnId}:hover { background: #222; border-color: #555; transform: translateX(-50%) translateY(-1px); }
            `);

            const btnText = CommonUtil.createElement("span", { text: "导出完整 Markdown" });
            const btn = CommonUtil.createElement("div", { id: this.btnId, childrens: [btnText] });

            btn.addEventListener("click", () => Chat.exportChat(btnText));
            (document.body || document.documentElement).appendChild(btn);
        },
        startWatcher: function() {
            this.inject();
            new MutationObserver(() => {
                if (!document.getElementById(this.btnId)) this.inject();
            }).observe(document.body, { childList: true, subtree: true });
        }
    };

    ExportUI.startWatcher();
})();
