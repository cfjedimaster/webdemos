<template>
	<div class="hello">
		<p>
		<a :href="link" target="_new">{{api}}</a> - {{desc}}
		</p>
	</div>
</template>

<script>
export default {
  name: 'Result',
  props: {
    link: String,
	api: String, 
	desc: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
