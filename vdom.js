/**
 * vue流程
 * 页面加载,根据正则解析真实dom字符串和vm.data生成vdom
 * vdom执行render渲染成真实dom
 * 当vm.data更新时,重新生成新的newVdom
 * 比较vdom和newVdom生成更新补丁patch
 * 根据patch更新到真实dom
 */
window.onload = function () {
     var vdom = VElement('div', { 'id': 'container'}, [
        VElement('h1', { style: 'color:red' }, ['simple virtual dom']),
        VElement('p', ['hello world']),
        VElement('ul', [VElement('li', ['item #1']), VElement('li', ['item #2'])]),
        VElement('input',{value:'123'})
    ]);
    var rootnode = vdom.render();
    var a={};
    var b={}
    if(a==b){
        alert(11)
    }
    document.body.appendChild(rootnode);
}
/**
 * patch补丁类型枚举
 */
var PATCHTYPE={
    REPLACE:'replace',//替换原有节点
    REORDER:'reorder',//调整子节点;添加,移动,删除等
    PROPS:'props',//修改属性
    /**
     * 文本替换
     */
    TEXT:'text'//修改文本
};




/**
 * 新旧vdom比较类
 */
class Diff{
    /**
     * 构造函数
     * @param {*} oldVDom 旧虚拟dom
     * @param {*} newVDom 新虚拟dom
     */
    constructor(oldVDom,newVDom){
        this.oldNode=oldVDom;
        this.newNode=newVDom;
        this.index=0;
        this.patches={};
    }
    /**
     * 执行新旧dom的比较,返回差异补丁patches
     * @return {*} patches 
     */
    executeDiff(){
        _diff(this.oldNode,this.newNode,this.index,this.patches);
        return this.patches;
    }
    /**
     * diff递归体
     * @param {*} oldNode 旧节点
     * @param {*} newNode 新节点
     * @param {*} index 节点编号,索引
     * @param {*} patches 补丁集合
     */
    _diff(oldNode,newNode,index,patches){
        var currentPatch=[];
        /**
         * currentPatch格式例子:
         * {
         *   "0":[{type:"1",xxx},{type:"2",xxx}],
         *   "1":[{type:"2",xxx},{type:"3",xxx}]
         * }
         */

        if(newNode===null){
            //依赖listdiff算法进行标记为删除
        }
        else if(Util.isString(oldNode)&&Util.isString(newNode)){
            //新旧节点都为字符串,则进行文本替换
            if(oldNode!==newNode){
                currentPatch.push({
                    type:PATCHTYPE.TEXT,
                    content:newNode
                });
            }
        }
        else if(oldNode.tagName===newNode.tagName){
            //新旧节点类型相同,则比较属性是否相同,记录属性的变动
            //新增,修改
            var propsPatches=_diffProps(oldNode,newNode);
            if(propsPatches){
                currentPatch.push({
                    type:PATCHTYPE.PROPS,
                    props:propsPatches
                });
            }
            //添加,删除
            var listPatches=_diffList(oldNode.childrenList,newNode.childrenList);
            if(listPatches.moves.length){
                var reorderPatch={
                    type:PATCHTYPE.REORDER,
                    moves:listPatches.moves
                };
                currentPatch.push(reorderPatch);
            }
        }
        else{
            //如果是不同节点类型,则记录替换
            currentPatch.push({
                type:PATCHTYPE.REPLACE,
                newNode:newNode
            });
        }
        if(currentPatch.length){
            patches[index]=currentPatch;
        }
    }
    /**
     * 比较属性差异,返回属性的差异
     * @param {*} oldNode 
     * @param {*} newNode 
     * @return {*} propsPatches 返回属性的增删改
     */
    _diffProps(oldNode,newNode){
        var oldProps=oldNode.props;
        var newProps=newNode.props;
        var propsPatches={};
        var diffCount=0;
        //更新或删除
        for(key in oldProps){
            if(newNode[key]!=oldProps[key]){
                propsPatches[key]=newNode[key];
                diffCount+=1;
            }
        }
        //新增
        for(key in newProps){
            if(!oldNode.hasOwnProperty(key)){
                propsPatches[key]=newProps[key];
                diffCount+=1;
            }
        }
        if(diffCount===0){
            return null;
        }
        return propsPatches;
    }
    /**
     * diff子节点
     * @param {*} oldChildren 旧的子节点
     * @param {*} newChildren 新的子节点
     * @param {*} index 当前旧的子节点的索引
     * @param {*} patches 总的补丁
     * @param {*} currentPatch 当前旧的子节点的父节点的补丁 
     */
    _diffChildren(oldChildrenList,newChildrenList,index,patches,currentPatch){
        var lastNode=null;
        var currentNodeIndex=index;
        oldChildrenList.forEach(function(oldChildren,index,oldChildrenList){
            var newChildren=newChildrenList[index];
            if(lastNode&&lastNode.count){
                currentNodeIndex+=lastNode.count+1;
            }
            else{
                currentNodeIndex+=1;
            }
            _diff(oldChildren,newChildren,currentNodeIndex,patches);
            lastNode=oldChildren;
        });
    }
    /**
     * 比较子节点的添加,删除
     * @param {*} oldList 
     * @param {*} newList 
     */
    _diffList(oldList,newList){
        
    }
}






/**
 * 用VElement方法,代替new Element
 * @param {*} tagName 
 * @param {*} props 
 * @param {*} childrenList 
 */
function VElement(tagName,props,childrenList){
    return new Element(tagName,props,childrenList); 
}
/**
 * 虚拟dom类
 */
class Element {
    /**
     * 构造函数
     * @param {String} tagName 标签名称 
     * @param {Object} props 标签属性
     * @param {List<VElement>} childrenList 子节点集合 
     */
    constructor(tagName,props,childrenList) {
        //支持只传标签名称和子节点集合
        if(Util.isArray(props)){
            childrenList=props;
            props={};
        }
        this.tagName=tagName;
        this.props=props||{};
        this.childrenList=childrenList||[];
        this.childrenCount=0;
        var countTemp=0;
        //计算节点的子节点数量,包含子节点的子节点
        this.childrenList.forEach(function(children,index,childrenList){
            if(children instanceof VElement){
                countTemp+=children.childCount;
            }
            countTemp++;
        });
        this.childrenCount=countTemp;

    }
    /**
     * 渲染虚拟dom为真实dom
     */
    render() {
        var el=document.createElement(this.tagName);
        var props=this.props;
        for(var key in props){
            var value=props[key];
            Util.setAttr(el,key,value);
        }
        this.childrenList.forEach(function(children,index,childrenList){
            var eleChildren;
            if(children instanceof Element){
                eleChildren= children.render();
            }
            else{
                eleChildren= document.createTextNode(children);
            }
            el.appendChild(eleChildren);
        });
        return el;
    }
}
/**
 * util工具类
 */
class Util{
    /**
     * 判断是否是字符串
     * @param {Object} obj 
     */
    static isString(obj){
        return _type(ojb)==='String';
    }
    /**
     * 判断是否是数组
     * @param {Object} list 
     */
    static isArray(list){
        return Util._type(list)==='Array';
    }
    /**
     * 给节点设置属性
     * des:style则设置样式,value则设置值,其它则设置属性
     * @param {*} node 
     * @param {*} key 
     * @param {*} value 
     */
    static setAttr(node,key,value){
        switch(key){
            case 'style':
                node.style.cssText=value;
                break;
            case 'value':
                var tagName=node.tagName;
                tagName=tagName.toLowerCase();
                if(tagName==='input'||tagName==='textarea'){
                    node.value=value;
                }
                else{
                    node.setAttribute(key,value);
                }
                break;
            default:
                node.setAttribute(key,value);
                break;

        }
    }

    static _type(obj){
        return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g,'');
    }
}