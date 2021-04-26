import { kebabCase } from '../utils/util';
/**
 * 获取迁移属性或者方法。
 * 
 */
export default {
  mounted() {
    // 开发环境下
    if (process.env.NODE_ENV === 'production') return;
    if (!this.$vnode) return;
    const { props = {}, events = {} } = this.getMigratingConfig();
    // 获取当前组件的配置
    const { data, componentOptions } = this.$vnode;
    const definedProps = data.attrs || {};
    const definedEvents = componentOptions.listeners || {};
    // 查找待
    for (let propName in definedProps) {
      propName = kebabCase(propName); // compatible with camel case
      if (props[propName]) {
        console.warn(`[Element Migrating][${this.$options.name}][Attribute]: ${props[propName]}`);
      }
    }
  // 查找待
    for (let eventName in definedEvents) {
      eventName = kebabCase(eventName); // compatible with camel case
      if (events[eventName]) {
        console.warn(`[Element Migrating][${this.$options.name}][Event]: ${events[eventName]}`);
      }
    }
  },
  // 获取迁移属性或者方法
  methods: {
    getMigratingConfig() {
      return {
        props: {},
        events: {}
      };
    }
  }
};
