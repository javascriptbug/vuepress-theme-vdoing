import Vue from 'vue';
import { isString, isObject } from './types';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function noop() {};

// 检测 obj 是否自带 key 属性
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
};
// 遍历_from的参数，赋值到to上，注意引用问题
function extend(to, _from) {
  for (let key in _from) {
    to[key] = _from[key];
  }
  return to;
};
// 将arr（对象数组）中所有对象的属性取出存至新的对象中
export function toObject(arr) {
  var res = {};
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res;
};
// 根据点运算符，按照对象的键值关系获取对应的值
// 如prop是a.c  则可以取到对象{a:{c:12}}中的值 12
export const getValueByPath = function(object, prop) {
  prop = prop || '';
  // split数组
  const paths = prop.split('.');
  let current = object;
  let result = null;
  // 循环数组取值
  for (let i = 0, j = paths.length; i < j; i++) {
    const path = paths[i];
    if (!current) break;
    if (i === j - 1) {
      // 最后一步,取值
      result = current[path];
      break;
    }
    // 循环赋值
    current = current[path];
  }
  return result;
};


//给于一个path路径标识符数组，系统通过对标识符数组对对象内部数据进行访问，直到找到底部。

// 根据点或者数组的方式获取对象中的数据
export function getPropByPath(obj, path, strict) {
  let tempObj = obj;
  // 将数组方式的取值改成以点的形式，如 a[b][c]，则变成了a.b.c
  // 也可以直接传a.b.c，不过此replace没有处理而已
  path = path.replace(/\[(\w+)\]/g, '.$1');
  // 将第一个是点的替换掉
  path = path.replace(/^\./, '');
  // 按点分割成数组
  let keyArr = path.split('.');
  let i = 0;
  // 循环向对象内部遍历
  for (let len = keyArr.length; i < len - 1; ++i) {
    if (!tempObj && !strict) break;
    let key = keyArr[i];
    if (key in tempObj) {
      // 键值正确,继续向内部遍历
      tempObj = tempObj[key];
    } else {
      // 不正确退出
      if (strict) {
        throw new Error('please transfer a valid prop path to form item!');
      }
      break;
    }
  }
  // 返回 o:遍历到的当前对象，k:key值，v:value值或null（没有的情况）
  return {
    o: tempObj,
    k: keyArr[i],
    v: tempObj ? tempObj[keyArr[i]] : null
  };
};


// 随机整数
export const generateId = function() {
  return Math.floor(Math.random() * 10000);
};
// 判断a与b是否全等，除了数组，数组内每项相同，也会返回true
export const valueEquals = (a, b) => {
  // 基本类型的，如数值，布尔值，字符串，undefined，null都返回 true
  // 引用类型的和NaN，通过
  if (a === b) return true;
  // NaN，以及除了数组之外的引用类型，都返回了false，只有a和b都是数组类型的通过
  if (!(a instanceof Array)) return false;
  if (!(b instanceof Array)) return false;
  // 检测数组的长度，长度不等则数组不相等
  if (a.length !== b.length) return false;
  // 长度相同的a和b数组，循环匹配数组内的每项是否相等，不等则false
  for (let i = 0; i !== a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
// 转义正则中用到的一些特殊字符
export const escapeRegexpString = (value = '') => String(value).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

// ES6 array下的find和findArray两个接口的不支持实现方式 
export const arrayFindIndex = function(arr, pred) {
  for (let i = 0; i !== arr.length; ++i) {
    if (pred(arr[i])) {
      return i;
    }
  }
  return -1;
};
export const arrayFind = function(arr, pred) {
  const idx = arrayFindIndex(arr, pred);
  return idx !== -1 ? arr[idx] : undefined;
};

// coerce truthy value to array
// 将传入值转化成数组，分三种情况
export const coerceTruthyValueToArray = function(val) {
  if (Array.isArray(val)) {
    // 是数组的，直接返回
    return val;
  } else if (val) {
    // 是正值得，放入数组中返回
    return [val];
  } else {
    // 其他情况，直接返回空数组
    return [];
  }
};
//是否是IE
export const isIE = function() {
  return !Vue.prototype.$isServer && !isNaN(Number(document.documentMode));
};
//是否是Edge
export const isEdge = function() {
  return !Vue.prototype.$isServer && navigator.userAgent.indexOf('Edge') > -1;
};
//是否是火狐
export const isFirefox = function() {
  return !Vue.prototype.$isServer && !!window.navigator.userAgent.match(/firefox/i);
};

export const autoprefixer = function(style) {
  if (typeof style !== 'object') return style;
  const rules = ['transform', 'transition', 'animation'];
  const prefixes = ['ms-', 'webkit-'];
  rules.forEach(rule => {
    const value = style[rule];
    if (rule && value) {
      prefixes.forEach(prefix => {
        style[prefix + rule] = value;
      });
    }
  });
  return style;
};
//MTitle =>  m-title
export const kebabCase = function(str) {
  const hyphenateRE = /([^-])([A-Z])/g;
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase();
};

export const capitalize = function(str) {
  if (!isString(str)) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// 判断对象 如果是对象 JSON.stringify 进行对象 
export const looseEqual = function(a, b) {
  const isObjectA = isObject(a);
  const isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    return JSON.stringify(a) === JSON.stringify(b);
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b);
  } else {
    return false;
  }
};

// 对比两个数组是否一致
export const arrayEquals = function(arrayA, arrayB) {
  arrayA = arrayA || [];
  arrayB = arrayB || [];

  if (arrayA.length !== arrayB.length) {
    return false;
  }

  for (let i = 0; i < arrayA.length; i++) {
    if (!looseEqual(arrayA[i], arrayB[i])) {
      return false;
    }
  }

  return true;
};
// 判断两个参数是否一致 字符串 数字  数组  对象 函数 
export const isEqual = function(value1, value2) {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return arrayEquals(value1, value2);
  }
  return looseEqual(value1, value2);
};

// 判断空
export const isEmpty = function(val) {
  // null or undefined
  if (val == null) return true;

  if (typeof val === 'boolean') return false;

  if (typeof val === 'number') return !val;

  if (val instanceof Error) return val.message === '';

  switch (Object.prototype.toString.call(val)) {
    // String or Array
    case '[object String]':
    case '[object Array]':
      return !val.length;

    // Map or Set or File
    case '[object File]':
    case '[object Map]':
    case '[object Set]': {
      return !val.size;
    }
    // Plain Object
    case '[object Object]': {
      return !Object.keys(val).length;
    }
  }

  return false;
};

export function rafThrottle(fn) {
  let locked = false;
  return function(...args) {
    if (locked) return;
    locked = true;
    window.requestAnimationFrame(_ => {
      fn.apply(this, args);
      locked = false;
    });
  };
}

// {a:3} => [{a:3}]
export function objToArray(obj) {
  if (Array.isArray(obj)) {
    return obj;
  }
  return isEmpty(obj) ? [] : [obj];
}
