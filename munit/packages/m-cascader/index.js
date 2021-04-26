import MCascader from './src/cascader';

/* istanbul ignore next */
MCascader.install = function(Vue) {
  Vue.component(MCascader.name, MCascader);
};

export default MCascader;
