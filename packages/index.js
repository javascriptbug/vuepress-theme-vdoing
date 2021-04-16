/*
* @author chenhaiyong
* Date: 21/04/16
*/
import Vue from 'vue'
import Gheader from './g-header/index'

const components = [
  Gheader,
]
const install = function(Vue) {
  if(install.installed) return
  components.map(component => Vue.component(component.name, component))
}


export default {
  install,
  Gheader,
}