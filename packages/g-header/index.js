import gHeader from './header.vue'  
gHeader.install = function(Vue) {
  Vue.component(gHeader.name, gHeader);
};

export default gHeader;