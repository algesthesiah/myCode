class linkList {
  constructor(element) {
    this.head = new Node('head') //头节点
    this.find = find //查找节点
    this.insert = insert //插入节点
    this.remove = remove //删除节点
    this.findPrev = findPrev //查找前一个节点
    this.display = display //显示链表
  }
}
class node {
  constructor(element) {
    this.element = element //当前节点的元素
    this.next = null //下一个节点链接
  }
}
var a = new node('nmb')
console.log(a)
