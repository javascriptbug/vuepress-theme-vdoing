/*
* @author chenhaiyong
* Date: 21/04/16
*/
import Vue from 'vue'
import Gtitle from './m-title/index'

const components = [
  Gtitle,
]
const install = function(Vue) {
  if(install.installed) return
  components.map(component => Vue.component(component.name, component))
}


export default {
  install,
  Gtitle,
}