import gHeader from './title.vue'  
gHeader.install = function(Vue) {
  Vue.component(gHeader.name, gHeader);
};

export default gHeader;