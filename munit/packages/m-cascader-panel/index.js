import MCascaderPanel from './src/cascader-panel';

/* istanbul ignore next */
MCascaderPanel.install = function(Vue) {
  Vue.component(MCascaderPanel.name, MCascaderPanel);
};

export default MCascaderPanel;
