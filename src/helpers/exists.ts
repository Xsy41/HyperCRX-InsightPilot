/**
 * @zh-CN 检查DOM元素是否存在
 * @en-US Check if a DOM element exists
 */
export default function exists(selector: string): boolean {
  return document.querySelector(selector) !== null;
}
