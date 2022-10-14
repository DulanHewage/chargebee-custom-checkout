<script setup>
defineProps({
  loading: {
    type: Boolean,
    defaukt: false,
  },
});
</script>

<template>
  <button v-bind="$attrs" class="d-flex align-items-center" :disabled="loading">
    <div class="prepend mr-4">
      <div class="loading-icon" v-if="loading">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          width="24px"
          height="24px"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid"
        >
          <circle
            cx="50"
            cy="50"
            fill="none"
            stroke="#ffffff"
            stroke-width="4"
            r="35"
            stroke-dasharray="164.93361431346415 56.97787143782138"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              repeatCount="indefinite"
              dur="1s"
              values="0 50 50;360 50 50"
              keyTimes="0;1"
            ></animateTransform>
          </circle>
        </svg>
      </div>
      <div v-else>
        <slot name="prepend"></slot>
      </div>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </button>
</template>

<style lang="scss" scoped>
button {
  height: 32px;
  background-color: #4fa4f3;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0px 16px;
  border: none;
  outline: none;
}

button:hover {
  background-color: #4590d6;
}

button:focus {
  box-shadow: #4fa4f366 0 0 0 3px;
}

button:disabled {
  background-color: rgb(113, 167, 218);
  color: rgba(255, 255, 255, 0.8);
  cursor: default;
}

button:active {
  background-color: #3b80c2;
  box-shadow: rgba(20, 70, 32, 0.2) 0 1px 0 inset;
}
button .prepend .loading-icon svg {
  margin: auto;
  background: transparent;
  display: block;
}
</style>
