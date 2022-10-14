<script setup>
defineProps({
  error: {
    type: Boolean,
    default: false,
  },
  success: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    class="alert d-flex align-items-center mt-4"
    :class="{ error: error, success: success }"
  >
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.alert {
  width: 100%;
  border-width: 1px;
  border-style: solid;
  padding: 8px 16px;
  background-color: #ccc;
  border-radius: 4px;
  font-size: 1rem;
  &.error {
    border-color: #f75465;
    background-color: #f3a2aa;
    color: #ad0a19;
  }
  &.success {
    border-color: #60af72;
    background-color: #8cefa4;
    color: #3d774c;
  }
}
</style>
