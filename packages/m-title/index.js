import mTitle from './title.vue'  
mTitle.install = function(Vue) {
  Vue.component(mTitle.name, mTitle);
};

export default mTitle;