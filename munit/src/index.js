/*
* @author chenhaiyong
* Date: 18/12/25
*/


import MTitle from '../packages/m-title/index'
import MCascader from '../packages/m-cascader/index'
const components = [
 
  MTitle,
  MCascader
]
const install = function(Vue) {
  if(install.installed) return
  components.map(component => Vue.component(component.name, component))
}


export default {
  install,

  MTitle,
  MCascader
}