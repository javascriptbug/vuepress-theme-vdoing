<template>
  <div
    ref="reference"
    :class="[
      'm-cascader',
      'ant-cascader-picker',
      realSize && `ant-cascader--${realSize}`,
      { 'ant-cascader-picker-disabled': isDisabled }
    ]"
    v-clickoutside="() => toggleDropDownVisible(false)"
    @mouseenter="inputHover = true"
    @mouseleave="inputHover = false"
    @click="() => toggleDropDownVisible(readonly ? undefined : true)"
    @keydown="handleKeyDown">

    <a-input
      ref="input"
      v-model="multiple ? presentText : inputValue"
      :size="realSize"
      :placeholder="placeholder"
      :readOnly="readonly"
      :disabled="isDisabled"
      :validate-event="false"
      :class="{ 'is-focus': dropDownVisible }"
      @focus="handleFocus"
      @blur="handleBlur"
      @change="handleInput">
      <template slot="suffix">
      
        <a-icon type="close-circle"
          v-if="clearBtnVisible"
          class="ant-cascader-picker-clear"
          @click.stop="handleClear"
          style="right:0px"
         />
        <a-icon type="down" 
          v-else
          :class="[
            'ant-cascader-picker-arrow',
            dropDownVisible && 'ant-cascader-picker-arrow-expand'
            ]" 
            style="right:0px"
            @click.stop="toggleDropDownVisible()"
          />
      </template>
    </a-input>

    <div v-if="multiple" class="m-cascader__tags">
      <a-tag
        v-for="(tag, index) in presentTags"
        :key="tag.key"
        type="info"
        :size="tagSize"
        :hit="tag.hitState"
        :closable="tag.closable"
        disable-transitions
        @close="deleteTag(index)">
        <span>{{ tag.text }}</span>
      </a-tag>
      <input
        v-if="filterable && !isDisabled"
        v-model="inputValue"
        type="text"
        class="m-cascader__search-input"
        :placeholder="presentTags.length ? '' : placeholder"
        @change="e => handleInput(inputValue, e)"
        @click.stop="toggleDropDownVisible(true)"
        @keydown.delete="handleDelete">
    </div>

    <transition name="m-zoom-in-top" @after-leave="handleDropdownLeave">
      <div
        v-show="dropDownVisible"
        ref="popper"
        :class="['m-popper', 'm-cascader__dropdown', popperClass]">
        <m-cascader-panel
          ref="panel"
          v-show="!filtering"
          v-model="checkedValue"
          :options="options"
          :props="config"
          :border="false"
          :render-label="$scopedSlots.default"
          @expand-change="handleExpandChange"
          @close="toggleDropDownVisible(false)"></m-cascader-panel>
        <m-scrollbar
          ref="suggestionPanel"
          v-if="filterable"
          v-show="filtering"
          tag="ul"
          class="m-cascader__suggestion-panel"
          view-class="m-cascader__suggestion-list"
          @keydown.native="handleSuggestionKeyDown">
          <template v-if="suggestions.length">
            <li
              v-for="(item, index) in suggestions"
              :key="item.uid"
              :class="[
                'm-cascader__suggestion-item',
                item.checked && 'is-checked'
              ]"
              :tabindex="-1"
              @click="handleSuggestionClick(index)">
              <span>{{ item.text }}</span>
              <a-icon type="check" v-if="item.checked" />
            </li>
          </template>
          <slot v-else name="empty">
            <li class="m-cascader__empty-text">{{  }}</li>
            <!-- t('el.cascader.noMatch') -->
          </slot>
        </m-scrollbar>
      </div>
    </transition>
  </div>
</template>

<script>
import Popper from '../../../src/utils/vue-popper';
import Clickoutside from '../../../src/utils/clickoutside';
import Emitter from '../../../src/mixins/emitter';

import Migrating from '../../../src/mixins/migrating';

import MScrollbar from '../../m-scrollbar';
import MCascaderPanel from '../../m-cascader-panel';
import AriaUtils from '../../../src/utils/aria-utils';
import { isEqual, isEmpty, kebabCase } from '../../../src/utils/util';
import { isUndefined, isFunction } from '../../../src/utils/types';
import { isDef } from '../../../src/utils/shared';
import { addResizeListener, removeResizeListener } from '../../../src/utils/resize-event';
import { debounce } from 'throttle-debounce';

const { keys: KeyCode } = AriaUtils;
const MigratingProps = {
  expandTrigger: {
    newProp: 'expandTrigger',
    type: String
  },
  changeOnSelect: {
    newProp: 'checkStrictly',
    type: Boolean
  },
  hoverThreshold: {
    newProp: 'hoverThreshold',
    type: Number
  }
};

const PopperMixin = {
  props: {
    placement: {
      type: String,
      default: 'bottom-start'
    },
    scrollElement: Popper.props.scrollElement,
    appendToBody: Popper.props.appendToBody, // Popper.props.appendToBody 是否插入全局
    visibleArrow: {
      type: Boolean,
      default: true
    },
    arrowOffset: Popper.props.arrowOffset,
    offset: Popper.props.offset,
    boundariesPadding: Popper.props.boundariesPadding,
    popperOptions: Popper.props.popperOptions
  },
  methods: Popper.methods,
  data: Popper.data,
  beforeDestroy: Popper.beforeDestroy
};

const InputSizeMap = {
  medium: 36,
  small: 32,
  mini: 28
};

export default {
  name: 'MCascader',

  directives: { Clickoutside },

  mixins: [PopperMixin, Emitter, Migrating],

  components: {
    MScrollbar,
    MCascaderPanel
  },

  props: {
    value: {},
    options: Array,
    props: Object,
    size: String,
    placeholder: {
      type: String,
      default: () => '请选择'
    },
    disabled: Boolean,
    clearable: Boolean,
    filterable: Boolean,
    filterMethod: Function,
    separator: {
      type: String,
      default: ' / '
    },
    scrollElement:String,
    showAllLevels: {
      type: Boolean,
      default: true
    },
    collapseTags: Boolean,
    debounce: {
      type: Number,
      default: 300
    },
    beforeFilter: {
      type: Function,
      default: () => (() => {})
    },
    popperClass: String
  },

  data() {
    return {
      dropDownVisible: false,
      checkedValue: this.value || null,
      inputHover: false,
      inputValue: null,
      presentText: null,
      presentTags: [],
      checkedNodes: [],
      filtering: false,
      suggestions: [],
      inputInitialHeight: 0,
      pressDeleteCount: 0
    };
  },

  computed: {
    realSize() {
      return this.size;
    },
    tagSize() {
      return ['small', 'mini'].indexOf(this.realSize) > -1
        ? 'mini'
        : 'small';
    },
    isDisabled() {
      return this.disabled;
    },
    config() {
      const config = this.props || {};
      const { $attrs } = this;

      Object
        .keys(MigratingProps)
        .forEach(oldProp => {
          const { newProp, type } = MigratingProps[oldProp];
          let oldValue = $attrs[oldProp] || $attrs[kebabCase(oldProp)];
          if (isDef(oldProp) && !isDef(config[newProp])) {
            if (type === Boolean && oldValue === '') {
              oldValue = true;
            }
            config[newProp] = oldValue;
          }
        });

      return config;
    },
    multiple() {
      return this.config.multiple;
    },
    leafOnly() {
      return !this.config.checkStrictly;
    },
    readonly() {
      return !this.filterable || this.multiple;
    },
    clearBtnVisible() {
      if (!this.clearable || this.isDisabled || this.filtering || !this.inputHover) {
        return false;
      }

      return this.multiple
        ? !!this.checkedNodes.filter(node => !node.isDisabled).length
        : !!this.presentText;
    },
    panel() {
      return this.$refs.panel;
    }
  },

  watch: {
    disabled() {
      this.computePresentContent();
    },
    value(val) {
      if (!isEqual(val, this.checkedValue)) {
        this.checkedValue = val;
        this.computePresentContent();
      }
    },
    checkedValue(val) {
      const { value, dropDownVisible } = this;
      const { checkStrictly, multiple } = this.config;

      if (!isEqual(val, value) || isUndefined(value)) {
        this.computePresentContent();
        // hide dropdown when single mode
        if (!multiple && !checkStrictly && dropDownVisible) {
          this.toggleDropDownVisible(false);
        }

        this.$emit('input', val);
        this.$emit('change', val);
        
      }
    },
    options: {
      handler: function() {
        this.$nextTick(this.computePresentContent);
      },
      deep: true
    },
    presentText(val) {
      //console.log(val)
      this.inputValue = val;
    },
    presentTags(val, oldVal) {
      if (this.multiple && (val.length || oldVal.length)) {
        this.$nextTick(this.updateStyle);
      }
    },
    filtering(val) {
      this.$nextTick(this.updatePopper);
    }
  },

  mounted() {
    const { input } = this.$refs;
    if (input && input.$el) {
      this.inputInitialHeight = input.$el.offsetHeight || InputSizeMap[this.realSize] || 40;
    }
    //console.log(this.inputInitialHeight)
    if (!isEmpty(this.value)) {
      this.computePresentContent();
    }

    this.filterHandler = debounce(this.debounce, () => {
      const { inputValue } = this;

      if (!inputValue) {
        this.filtering = false;
        return;
      }

      const before = this.beforeFilter(inputValue);
      if (before && before.then) {
        before.then(this.getSuggestions);
      } else if (before !== false) {
        this.getSuggestions();
      } else {
        this.filtering = false;
      }
    });
  var _this = this;
    addResizeListener(_this.$el, _this.updateStyle);
  },

  beforeDestroy() {
    removeResizeListener(this.$el, this.updateStyle);
  },

  methods: {
    getMigratingConfig() {
      return {
        props: {
          'expand-trigger': 'expand-trigger is removed, use `props.expandTrigger` instead.',
          'change-on-select': 'change-on-select is removed, use `props.checkStrictly` instead.',
          'hover-threshold': 'hover-threshold is removed, use `props.hoverThreshold` instead'
        },
        events: {
          'active-item-change': 'active-item-change is renamed to expand-change'
        }
      };
    },
    toggleDropDownVisible(visible) {
      if (this.isDisabled) return;

      const { dropDownVisible } = this;
      const { input } = this.$refs;
      visible = isDef(visible) ? visible : !dropDownVisible;
      if (visible !== dropDownVisible) {
        this.dropDownVisible = visible;
        if (visible) {
          this.$nextTick(() => {
            this.updatePopper();
            this.panel.scrollIntoView();
          });
        }
        input.$refs.input.setAttribute('aria-expanded', visible);
        this.$emit('visible-change', visible);
      }
    },
    handleDropdownLeave() {
      this.filtering = false;
      this.inputValue = this.presentText;
    },
    handleKeyDown(event) {
      switch (event.keyCode) {
        case KeyCode.enter:
          this.toggleDropDownVisible();
          break;
        case KeyCode.down:
          this.toggleDropDownVisible(true);
          this.focusFirstNode();
          event.preventDefault();
          break;
        case KeyCode.esc:
        case KeyCode.tab:
          this.toggleDropDownVisible(false);
          break;
      }
    },
    handleFocus(e) {
      this.$emit('focus', e);
    },
    handleBlur(e) {
      this.$emit('blur', e);
    },
    handleInput(val, event) {
      //console.log(val,'handleInput')
      !this.dropDownVisible && this.toggleDropDownVisible(true);

      if (event && event.isComposing) return;
      if (val) {
        this.filterHandler();
      } else {
        this.filtering = false;
      }
    },
    handleClear() {
      this.presentText = '';
      this.panel.clearCheckedNodes();
    },
    handleExpandChange(value) {
     // console.log(value,'handleExpandChange')
      this.$nextTick(this.updatePopper.bind(this));
      this.$emit('expand-change', value);
      this.$emit('active-item-change', value); // Deprecated
    },
    focusFirstNode() {
      this.$nextTick(() => {
        const { filtering } = this;
        const { popper, suggestionPanel } = this.$refs;
        let firstNode = null;

        if (filtering && suggestionPanel) {
          firstNode = suggestionPanel.$el.querySelector('.m-cascader__suggestion-item');
        } else {
          const firstMenu = popper.querySelector('.m-cascader-menu');
          firstNode = firstMenu.querySelector('.m-cascader-node[tabindex="-1"]');
        }

        if (firstNode) {
          firstNode.focus();
          !filtering && firstNode.click();
        }
      });
    },
    computePresentContent() {
      // nextTick is required, because checked nodes may not change right now
      this.$nextTick(() => {
        if (this.config.multiple) {
          this.computePresentTags();
          this.presentText = this.presentTags.length ? ' ' : null;
        } else {
          this.computePresentText();
        }
      });
    },
    computePresentText() {
      const { checkedValue, config } = this;
      if (!isEmpty(checkedValue)) {
        const node = this.panel.getNodeByValue(checkedValue);
        if (node && (config.checkStrictly || node.isLeaf)) {
          this.presentText = node.getText(this.showAllLevels, this.separator);
          return;
        }
      }
      this.presentText = null;
    },
    computePresentTags() {
      const { isDisabled, leafOnly, showAllLevels, separator, collapseTags } = this;
      const checkedNodes = this.getCheckedNodes(leafOnly);
      const tags = [];

      const genTag = node => ({
        node,
        key: node.uid,
        text: node.getText(showAllLevels, separator),
        hitState: false,
        closable: !isDisabled && !node.isDisabled
      });

      if (checkedNodes.length) {
        const [first, ...rest] = checkedNodes;
        const restCount = rest.length;
        tags.push(genTag(first));

        if (restCount) {
          if (collapseTags) {
            tags.push({
              key: -1,
              text: `+ ${restCount}`,
              closable: false
            });
          } else {
            rest.forEach(node => tags.push(genTag(node)));
          }
        }
      }

      this.checkedNodes = checkedNodes;
      this.presentTags = tags;
    },
    getSuggestions() {
      let { filterMethod } = this;

      if (!isFunction(filterMethod)) {
        filterMethod = (node, keyword) => node.text.includes(keyword);
      }

      const suggestions = this.panel.getFlattedNodes(this.leafOnly)
        .filter(node => {
          if (node.isDisabled) return false;
          node.text = node.getText(this.showAllLevels, this.separator) || '';
          return filterMethod(node, this.inputValue);
        });

      if (this.multiple) {
        this.presentTags.forEach(tag => {
          tag.hitState = false;
        });
      } else {
        suggestions.forEach(node => {
          node.checked = isEqual(this.checkedValue, node.getValueByOption());
        });
      }

      this.filtering = true;
      this.suggestions = suggestions;
      this.$nextTick(this.updatePopper);
    },
    handleSuggestionKeyDown(event) {
      const { keyCode, target } = event;
      switch (keyCode) {
        case KeyCode.enter:
          target.click();
          break;
        case KeyCode.up:
          const prev = target.previousElementSibling;
          prev && prev.focus();
          break;
        case KeyCode.down:
          const next = target.nextElementSibling;
          next && next.focus();
          break;
        case KeyCode.esc:
        case KeyCode.tab:
          this.toggleDropDownVisible(false);
          break;
      }
    },
    handleDelete() {
      const { inputValue, pressDeleteCount, presentTags } = this;
      const lastIndex = presentTags.length - 1;
      const lastTag = presentTags[lastIndex];
      this.pressDeleteCount = inputValue ? 0 : pressDeleteCount + 1;

      if (!lastTag) return;

      if (this.pressDeleteCount) {
        if (lastTag.hitState) {
          this.deleteTag(lastIndex);
        } else {
          lastTag.hitState = true;
        }
      }
    },
    handleSuggestionClick(index) {
      const { multiple } = this;
      const targetNode = this.suggestions[index];

      if (multiple) {
        const { checked } = targetNode;
        //console.log(checked,"handleSuggestionClick")
        targetNode.doCheck(!checked);
        this.panel.calculateMultiCheckedValue();
      } else {
        this.checkedValue = targetNode.getValueByOption();
        this.toggleDropDownVisible(false);
      }
    },
    deleteTag(index) {
      const { checkedValue } = this;
      const val = checkedValue[index];
      this.checkedValue = checkedValue.filter((n, i) => i !== index);
      //console.log(val)
      this.$emit('remove-tag', val);
    },
    updateStyle() {
      const { $el, inputInitialHeight } = this;
      if (this.$isServer || !$el) return;

      const { suggestionPanel } = this.$refs;
      const inputInner = $el.querySelector('.ant-input');

      if (!inputInner) return;

      const tags = $el.querySelector('.m-cascader__tags');
      let suggestionPanelEl = null;

      if (suggestionPanel && (suggestionPanelEl = suggestionPanel.$el)) {
        const suggestionList = suggestionPanelEl.querySelector('.m-cascader__suggestion-list');
        suggestionList.style.minWidth = inputInner.offsetWidth + 'px';
      }

      if (tags) {
        const { offsetHeight } = tags;
        const height = Math.max(offsetHeight + 6, inputInitialHeight) + 'px';
        inputInner.style.height = height;
        this.updatePopper();
      }
    },

    /**
     * public methods
    */
    getCheckedNodes(leafOnly) {
      return this.panel.getCheckedNodes(leafOnly);
    }
  }
};
</script>

