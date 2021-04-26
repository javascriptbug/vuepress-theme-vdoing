<template>
   <div class="baseinfo-item-header" :class="classObject">
        <div class="baseinfoheader-wrap">
          <span class="baseinfoheader-icon"></span>
           <span class="baseinfoheader-tit">{{ title }}</span>
           <span class="baseinfoheader-tip" v-if="tip">{{ tip }}</span>
           <span class="baseinfoheader-sub" v-if="sub">{{ sub }}</span>
        </div>
        <span class="baseinfoheader-last" v-if="last">{{ last }}</span>
      </div>
</template>
<script>
  export  default {
    name: 'MTitle',
    data() {
      return {
      };
    },
    methods:{
    },
    props: ["title","tip","last","classObject","sub"],
  }
</script>

