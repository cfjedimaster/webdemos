import Vue from 'vue'
import Router from 'vue-router'
import ServiceList from '@/components/ServiceList'
import TypeList from '@/components/TypeList'
import Detail from '@/components/Detail'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ServiceList',
      component: ServiceList
    },
    {
			path:'/type/:type/name/:name/lat/:lat/lng/:lng',
			component:TypeList,
			name:'typeList',
			props:true
    },
    {
			path:'/detail/:placeid',
			component:Detail,
			name:'detail',
			props:true
		}

  ]
})
