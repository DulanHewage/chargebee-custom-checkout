<script setup>
defineProps({
  msg: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="payment-form-wrapper">
    <h1>{{ msg }}</h1>
  </div>
</template>

<style lang="scss" scoped>
.payment-form-wrapper {
  h1 {
    color: red;
  }
}
</style>
