<template>
  <div class="stack-item" v-if="shouldShow(stack)">
    <div class="panel panel-default panel-stack border">
      <div class="panel-heading stack-name">
        <div :class="['stacks-state', stack.state==='active'?'green-state':'red-state']"></div>
        <div class="stacks-icon">
          <i :class="['istio-icon', stack.istio?'wise-icon-istio-on':'wise-icon-istio-off']"></i>
          <!-- <i v-if="!toggleStatus(stack.services?stack.services.length:0) " class="fa fa-minus service-collapse-icon" -->
          <!-- <i v-if="toggleNavIcon" class="fa fa-minus service-collapse-icon" @click="toggleStackList()" :href=" '#collapse' + stack.uuid"
            data-toggle="collapse" aria-hidden="true">&nbsp;</i>
          <i v-else class="fa fa-plus service-collapse-icon" @click="toggleStackList()" :href=" '#collapse' + stack.uuid" data-toggle="collapse"
            aria-hidden="true">&nbsp;</i> -->

          <span class="name hint--right help hint--medium" :aria-label="stack.description" @click="showOneStackDetail(stack)">
            {{stack.name}}
          </span>
          <el-tooltip placement="right" effect="light" v-if="stack.deployErr && stack.state === 'deactive'" popper-class="error-tips popper-tips" class="el-tip">
            <div slot="content" class="content">{{stack.deployErr}}</div>
            <i class="el-icon-warning pointer" aria-hidden="true"></i>
          </el-tooltip>
          <el-tooltip placement="right" effect="light" v-if="stack.status === 'creating'" popper-class="creating-tips popper-tips" class="creating-tip">
            <div slot="content" class="content">创建中</div>
            <i class="el-icon-warning pointer" aria-hidden="true"></i>
          </el-tooltip>
        </div>
        <div class="stack-opts operation-btn-wrapper dropdown">
          <button type="button" class="btn btn-default btn-xs hint--top help" aria-label="更多操作" data-toggle="dropdown"><i class="fa fa-ellipsis-h" aria-hidden="true" ></i></button>
          <ul class="dropdown-menu">
            <li class="edit">
              <button class="btn" @click="showYamlModal(stack.name,stack.envId,stack.uuid)">
                <i class="fa fa-pencil"></i> 编排文件
              </button>
             </li>
            <li class="del">
              <button class="btn" :disabled="!getPermission('stacks_delete')" @click="showForceDeleteMadal({name: stack.name, stackId:stack.uuid, envId:stack.envId},'stack')">
                <i class="fa fa-trash"></i> 删除堆栈
              </button>
            </li>
          </ul>
        </div>

        <div class="environment-container" v-if="false">
          <p>{{envName || stack.env_name}}</p>
          <span>所属集群</span>
        </div>

        <div class="float-right op-wrapper stack-add-service-wrapper" v-if="getPermission('stack_service_add')">
          <el-dropdown split-button type="primary" id="operation-btns" class="" @click="goCertainService(JSON.stringify({routeName: 'bs-add', stackId: stack.uuid, envId: stack.envId, stackName: stack.name}))"
            @command="goCertainService">
            <router-link :to="{name: 'bs-add' , params: { team_id: teamId, env_id: stack.envId, stack_id: stack.uuid, stack_name: stack.name }}">添加服务</router-link>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command='JSON.stringify({routeName:"ingress-add", stackId: stack.uuid, envId: stack.envId, stackName: stack.name})'>
                <span> 路由服务 </span>
              </el-dropdown-item>
              <el-dropdown-item :command='JSON.stringify({routeName:"lb-add", stackId: stack.uuid, envId: stack.envId, stackName: stack.name})'>
                <span> 内部负载均衡 </span>
              </el-dropdown-item>
              <el-dropdown-item :command='JSON.stringify({routeName:"external-add", stackId: stack.uuid, envId: stack.envId, stackName: stack.name})'>
                <span> 外部服务 </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

      </div>
      <!-- <div :class="['panel-body collapse',(!stack.services || stack.services.length==0) ? 'out' : ' in']"
           :id="'collapse' + stack.name"> -->
      <div v-if="showOneStack" :class="['panel-body collapse', !showOneStack ? 'out' : ' in']" :id="'collapse' + stack.name">

        <table class="table">
          <tbody>
            <!-- <tr v-if="!services || services.totalSize===0"> -->
            <tr v-if="!services.data || services.data.length===0">
              <td class="none-service-td">
                没有任何服务
              </td>
            </tr>
            <tr v-for="(service, index) in services.data" :key="index" v-if="service.state !== 'removed'" :class="'tr-service tr-service-' + service.state">
              <td :class="'td-service-status td-service-status-' + service.state" style="width:15%">
                <i v-if="service.state === 'inactive'" class="fa fa-exclamation-triangle" aria-hidden="true"></i>
                <span class=" stack-service-status stack-service-status ">
                  <i v-if="service.state !== 'stopped' && (service.state === 'active' || service.state === 'completed' || service.state === 'fail' || service.state === 'onboard' || service.state === 'upgraded')"
                    class="fa fa-cubes"></i>
                  <i class="fa fa-spinner fa-spin fa-1x fa-fw" v-if="service.state !== 'stopped' && service.state !== 'active' && service.state !== 'completed' && service.state !== 'fail' && service.state !== 'onboard' && service.state !== 'upgraded'"></i>
                  <i class="fa fa-cubes fa-black" v-if="service.state === 'stopped'"></i>
                  {{service.state}}
                </span>
              </td>
              <td class="stack-service-name">
                <!-- externalService -->
                <a v-if="service.type ==='externalService' || service.wise2cServiceType==='externalService'" id="external">
                  <span>{{service.name}}</span>
                </a>
                <!-- ingress -->
                <router-link v-if="from === 'applicationList' && service.wise2cServiceType==='ingress'" :to="goIngressDetail(stack.envId, stack.id, stack.name, service.name, from, service.groupName)">
                  <span>{{service.name}}</span>
                </router-link>
                <!-- service -->
                <router-link v-if="from === 'applicationList' &&  service.wise2cServiceType!=='ingress' && service.wise2cServiceType!=='externalService'"
                  :to="{name: 'app-containers' , params:{team_id:teamId, stack_id:stack.id, stack_uuid:stack.uuid, stack_name:stack.name, env_id:stack.envId, service_id: service.uuid, service_name:service.name, service_type:service.wise2cServiceType, type:tag, from:from} }">
                  <span>{{service.name}}</span>
                </router-link>
                <template v-if="checkCronjob(stack.name) && service.wise2cServiceType==='cronJob'">
                  <el-tooltip effect="dark" :content="'任务周期：'+service.cronExpression" placement="top">
                    <i class="fa fa-info-circle"></i>
                  </el-tooltip>
                </template>
                <el-tooltip placement="right" effect="light" v-if="service.warn_msg" popper-class="error-tips" class="el-tip">
                  <div slot="content" class="content">{{service.warn_msg}}</div>
                  <i class="fa fa-exclamation-triangle fa-1x icon" aria-hidden="true"></i>
                </el-tooltip>
              </td>
              <!-- <td class="service-type"><span class="label label-default">{{i18n[service.type]}}</span></td> -->
              <td class="service-type">
                <p class="label-type">{{i18n[service.wise2cServiceType]}}</p>
                <!-- <label class="label label-default wd-100">{{i18n[service.wise2cServiceType]}}</label> -->
              </td>

              <td v-if="service.type ==='externalService' ">
                链接到服务： {{extService(service)}}
              </td>

              <td class="p0 service-image" v-if="service.type !=='externalService' && !['ingress', 'externalService', 'lb'].includes(service.wise2cServiceType)">
                镜像：{{service.image}}
              </td>
              <td class="p0 service-image" v-if="service.wise2cServiceType==='externalService'">
                <span v-for="(endpoint, index) in service.end_points" :key="index">{{endpoint.ip || endpoint.host_name}}
                  <b v-if="service.end_points.length-1>index">,</b>
                </span>
              </td>
              <td class="p0 service-image" v-if="['ingress', 'lb'].includes(service.wise2cServiceType)">
                <p v-if="showPorts(index)" class="ingress-target" :id="'ingress-target-'+index">后端：<template v-for="(port, index) in service.targetList">{{port}}<template v-if="service.targetList.length-1>index">,&nbsp;&nbsp;</template></template></p>
                <el-tooltip placement="top" v-else>
                  <div slot="content" class="tip-content">
                    <span v-for="(port, index) in service.targetList" class="tip-item" :key="index">{{port}}<template v-if="index+1<service.targetList.length">,&nbsp;&nbsp;</template></span>
                  </div>
                  <p class="ingress-target pointer" :id="'ingress-target-'+index">后端：<template v-for="(port, index) in service.targetList">{{port}}<b v-if="service.targetList.length-1>index" :key="index">,&nbsp;&nbsp;</b></template></p>
                </el-tooltip>
              </td>
              <!--<td v-if="checkCronjob(stack.name) && service.wise2cServiceType==='cronJob'">{{service.cronExpression}}</td>-->

              <td class="operation-btn-wrapper dropdown">
                <button type="button" class="btn btn-default btn-xs hint--top help" aria-label="更多操作" data-toggle="dropdown"><i class="fa fa-ellipsis-h" aria-hidden="true" ></i></button>
                <ul class="dropdown-menu">
                  <li v-if="!['upgrading', 'upgraded', 'stopped'].includes(service.state)
                    && (service.wise2cServiceType==='service' || service.wise2cServiceType ==='daemonset' || service.wise2cServiceType ==='cronJob' || service.wise2cServiceType==='statefulSet')">
                    <button class="btn" :disabled="!getPermission('stack_service_update')" @click="retrieveUpgradeInfo(stack.envId, service.uuid, service.wise2cServiceType)">
                      <i class="fa fa-arrow-up"></i> 升级
                    </button>
                  </li>
                  <!-- lb 编辑 -->
                  <li v-if="service.state ==='active' && service.wise2cServiceType ==='lb' && false">
                    <button class="btn" @click="updataLb(service.image,stack.envId,service.uuid,service.wise2cServiceType)">
                      <i class="fa fa-pencil"></i> 编辑
                    </button>
                  </li>
                  <li v-if="service.state ==='upgraded'">
                    <button :disabled="!getPermission('stack_service_update')" class="btn" @click="finishUpgradeServiceById(stack.envId, service.uuid, service.wise2cServiceType)">
                      <i class="fa fa-paper-plane"></i> 完成升级
                    </button>
                  </li>
                  <li v-if="service.state ==='upgraded' || service.state ==='upgrading' || service.state ==='upgrading'">
                    <button :disabled="!getPermission('stack_service_update')" class="btn" @click="rollbackServiceById(stack.envId, service.uuid,service.wise2cServiceType)">
                      <i class="fa fa-paper-plane"></i> 回滚
                    </button>
                  </li>
                  <li v-if="false" class="disabled">
                    <button class="btn" @click="cancelUpgradeServiceById(stack.envId, service.id)">
                      <i class="fa fa-paper-plane"></i> 取消升级
                    </button>
                  </li>
                  <li v-if="service.type!=='externalService' &&
                    service.wise2cServiceType!=='ingress' &&
                    service.wise2cServiceType!=='lb' &&
                    service.wise2cServiceType!=='job' &&
                    service.wise2cServiceType!=='cronJob'&&
                    false">
                    <i class="fa fa-paper-plane" aria-hidden="true"></i>
                    <router-link :to="{name: 'app-service-stragegy', params:{team_id: teamId, env_id:stack.envId, service_id: service.uuid, service_type:service.wise2cServiceType}}">
                      编辑
                    </router-link>
                  </li>
                  <li v-if="service.wise2cServiceType!=='job' && service.state !== 'upgraded' && service.state !== 'upgrading'">
                    <button :disabled="!getPermission('stack_service_edit')" class="btn" @click="goUpgradeServicePage(stack.uuid, stack.envId, service.name, service.wise2cServiceType, service.id, stack.name )">
                      <i class="fa fa-pencil"></i> 编辑
                    </button>
                  </li>

                  <li v-if="service.wise2cServiceType==='statefulSet' || service.wise2cServiceType==='service'|| service.wise2cServiceType==='daemonset'">
                    <button :disabled="!getPermission('stack_service_edit')" class="btn" @click="reStart(stack,service)">
                      <svg-icon style='margin-right:7.5px;' icon-class="restartLoading"></svg-icon>重启
                    </button>
                  </li>
                  <li v-if="service.state !== 'upgraded' && service.state !== 'upgrading'">
                    <button :disabled="!getPermission('stack_service_delete')" class="btn" @click="showForceDeleteMadal({name: service.name, envId:stack.envId, serviceId:service.uuid, stackUuid:stack.uuid, serviceType:service.wise2cServiceType}, 'service', service)">
                      <i class="fa fa-trash"></i> 删除
                    </button>
                  </li>
                </ul>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
  @import 'src/components/application-center/list-style.scss';
</style>
<script type="text/javascript">
  /* eslint func-names: 'off' */
  import { getEnvType } from 'utils/feature-toggle'
  import { indexOf } from 'lodash'
  import { getPermission } from 'utils/user-utils'
  import { promptOnDeleteCustomInfo } from 'utils/prompt'
  import { mapActions } from 'vuex'

  export default {
    props: ['stack', 'envName', 'cronjStacks', 'showOneStack', 'from', 'AppName', 'services'],
    components: {
    },
    data() {
      return {
        envUUid: '',
        toggleNavIcon: false,
        i18n: {
          externalService: '外部服务',
          '': '服务',
          service: '无状态服务',
          business: '无状态服务',
          ingress: '路由服务',
          lb: '内部负载均衡服务',
          dnsService: 'DNS服务',
          unhealthy: '健康检查失败',
          healthy: '健康',
          job: '批处理服务',
          cronJob: '定时服务',
          daemonset: '全局服务',
          statefulSet: '有状态服务'
        },
        upgradeparam: {
          team_id: '',
          env_id: '',
          service_id: ''
        },
        serviceImage: '',
        serviceType: '',
        data: {},
        service: {},
        bgconf: {},
        delServiceData: {},
        delStackData: {},
      }
    },
    computed: {
      teamId() {
        return this.$route.params.team_id
      },
      tag() {
        if (this.$route.name.includes('app-list')) {
          return 'appcenter'
        }
        return ''
      },
    },
    watch: {
      '$route.path': function (newPath) {
        if (newPath.includes('/one_stack/')) {
          this.toggleNavIcon = true
        } else {
          this.toggleNavIcon = false
        }
      }
    },
    mounted() {
    },
    methods: {
      ...mapActions('externalRegistry', ['retrieveRegistryImageInTeam']),
      ...mapActions('common', ['showLoading', 'hideLoading']),
      ...mapActions('appcenter', ['delServiceFromOneStack', 'rollbackService', 'finishUpgradeService', 'cancelUpgradeService', 'retrieveServiceBrief', 'deleteAppCenterStack', 'retrieveBgconf', 'checkIngress', 'postStackRollback']),
      getPermission,
      getEnvType,
      shouldShow(stack) {
        if (this.showOneStack) {
          return stack.name === this.$route.params.stack_name
        }
        return true
      },
      goCertainService(obj) {
        obj = JSON.parse(obj)
        this.$router.push({
          name: obj.routeName,
          params: {
            stack_name: obj.stackName,
            team_id: this.teamId,
            stack_id: obj.stackId,
            env_id: obj.envId
          }
        })
      },
      goUpgradeServicePage(stackId, envId, serviceName, serviceType, serviceId, stackName) {
        let routeName = null
        switch (serviceType) {
        case 'externalService':
          routeName = 'external-upgrade'
          break
        case 'ingress':
          routeName = 'ingress-upgrade'
          break
        case 'lb':
          routeName = 'lb-upgrade'
          break
        default:
          routeName = 'bs-upgrade'
          break
        }
        this.$router.push({
          name: routeName,
          params: {
            stack_name: stackName,
            env_id: envId,
            stack_id: stackId,
            sname: serviceName,
            service_id: serviceId
          }
        })
      },
      retrieveUpgradeInfo(envId, serviceId, serviceType) {
        this.serviceType = serviceType
        this.retrieveServiceBrief(
          { teamId: this.teamId, envId, serviceId }
        ).then((res) => {
          this.service = res
          this.retrieveBgConfById()
        })
      },
      retrieveBgConfById() {
        if (this.getEnvType() === 'K8S') {
          if (this.serviceType === 'service') {
            this.checkIngress(
              { teamId: this.teamId, envId: this.stack.envId, serviceId: `${this.stack.name}_${this.service.name}` }
            ).then((res) => {
              this.bgconf = res
            }).catch(() => {
              this.bgconf.includeIngress = false
              this.bgconf.associatedIngress = false
            }).finally(() => this.showUpgrade())
          } else {
            this.bgconf.includeIngress = false
            this.bgconf.associatedIngress = false
            this.showUpgrade()
          }
        } else {
          this.retrieveBgconf(
            { teamId: this.teamId, envId: this.stack.envId, serviceId: this.service.id }
          ).then((res) => {
            this.bgconf = res
            this.showUpgrade()
          })
        }
      },
      showUpgrade() {
        const data = {
          param: {
            teamId: this.teamId,
            envId: this.stack.envId,
            stackName: this.stack.name,
            serviceName: this.service.name,
            serviceId: this.service.uuid,
            serviceType: this.serviceType
          },
          bgconf: this.bgconf,
          stackTopology: this.stack.topology,
          service: this.service,
          stackServices: this.services
        }
        this.data = data
        this.$root.eventHub.$emit('app-center-upgrade-info', data)
        $('#upgrade_modal').modal()
        this.hideLoading()
      },
      hideUpgrade() {
        $('#upgrade_modal').modal('hide')
      },
      image(imageUuid) {
        return imageUuid ? imageUuid.substring(7) : ''
      },
      extService(service) {
        return service.externalService.externalIpAddresses[0]
      },
      reStart(stack, service) {
        const envId = stack.envId,
              stackNameSpace = stack.ns,
              name = service.name,
              wise2cServiceType = service.wise2cServiceType,
              {
                team_id, stack_name
              } = this.$route.params
        this.$msg({
          title: '确认重启',
          msg: `你确认要重启服务${name}吗？`,
          callBack: () => this.postStackRollback({
            teamId: team_id,
            envId,
            stackName: stack_name,
            params: {
              stackNameSpace, name, wise2cServiceType
            }
          }),
        }).then(() => this.reGetStacks(team_id, envId))
      },
      showForceDeleteMadal(obj, delType, service) {
        const name = obj.name
        const str = delType === 'service' ? `服务 ${name} ` : `堆栈 ${name} `
        if (delType === 'service') {
          this.delServiceData = obj
          this.delServiceById(str, false, service)
        } else {
          this.delStackData = obj
          this.delStackByType(str, false)
        }
      },
      delServiceById(str, force, service) {
        promptOnDeleteCustomInfo(this, null, str, () => {
          this.showLoading()
          const { team_id } = this.$route.params
          this.delServiceFromOneStack(
            { teamId: team_id, envId: this.delServiceData.envId, serviceId: this.delServiceData.serviceId, serviceType: this.delServiceData.serviceType, force }
          ).then(() => {
            // 以下是前端直接获取，不是websocket删除后通知获取
            this.hideLoading()
            this.getServiveByFather()
          })
        })
      },
      delStackByType(str, force) {
        const { team_id } = this.$route.params
        promptOnDeleteCustomInfo(this, null, str, () => {
          if (this.$route.path.includes('appcenter')) {
            this.deleteAppCenterStack(
              { teamId: team_id, stackId: this.delStackData.stackId, envId: this.delStackData.envId, force }
            ).then(() => {
              this.reGetStacks(team_id, this.delStackData.envId)
              if (this.$route.name === 'one_stack_detail') {
                this.$router.push({
                  name: 'app-list',
                  params: {
                    team_id: this.$route.params.team_id
                  }
                })
              }
            })
          }
        })
      },
      rollbackServiceById(envId, serviceUuid) {
        const {
          team_id
        } = this.$route.params
        this.rollbackService(
          { teamId: team_id, envId, serviceId: serviceUuid }
        ).then(() => this.reGetStacks(team_id, envId))
      },
      finishUpgradeServiceById(envId, serviceId) {
        const {
          team_id
        } = this.$route.params
        this.finishUpgradeService(
          { teamId: team_id, envId, serviceId }
        ).then(() => this.reGetStacks(team_id, envId))
      },
      cancelUpgradeServiceById(envId, serviceId) {
        const {
          team_id
        } = this.$route.params
        this.cancelUpgradeService(
          { teamId: team_id, envId, serviceId }
        ).then(() => this.reGetStacks(team_id, envId))
      },
      toggleStatus(length) {
        if (this.toggleNavIcon === false && length === 0) {
          return !this.toggleNavIcon
        }
        return length !== 0 && this.toggleNavIcon
      },
      toggleStackList() {
        this.toggleNavIcon = !this.toggleNavIcon
      },
      showOneStackDetail(stack) {
        this.$router.push({
          name: 'one_stack_detail',
          params: {
            team_id: this.teamId,
            env_id: stack.envId,
            stack_name: stack.name
          }
        })
      },
      updataLb(serviceImg, envId, serviceId, serviceType) {
        this.$router.push({
          name: 'app-service-lb',
          params: {
            team_id: this.teamId,
            env_id: envId,
            service_id: serviceId,
            service_type: serviceType
          }
        })
      },
      checkCronjob(stackName) {
        const index = indexOf(this.cronjStacks, stackName)
        if (index > -1) {
          return true
        }
        return false
      },
      showYamlModal(stackName, envId, stackUuid) {
        const obj = {
          teamId: this.teamId,
          envId,
          stackUuid,
          stackName
        }
        this.$root.eventHub.$emit('retrieve-yaml', obj)
        $('#yaml_modal').modal()
      },
      // 应用中心页面是通过env去获取stacks 应用目录是通过productId去获取stacks
      reGetStacks(teamId, envId) {
        if (this.$route.name === 'certatainProductApp') {
          this.$root.eventHub.$emit('RE_GET_APP_STACKS')
        } else {
          this.$emit('refreshData')
          this.hideLoading()
        }
      },
      getServiveByFather() {
        setTimeout(() => {
          this.$emit('getService')
        }, 200)
      },
      goIngressDetail(envId, stackId, stackName, serviceName, from, groupName) {
        const router1 = {
          name: 'app-containers-details',
          params: {
            env_id: envId, stack_id: stackId, stack_name: stackName, service_name: serviceName, from
          }
        }
        const router2 = {
          name: 'app-containers-details-group',
          params: {
            env_id: envId, stack_id: stackId, stack_name: stackName, service_name: serviceName, from, group_name: groupName
          }
        }
        if (!!groupName) return router2
        return router1
      },
      showPorts(index) {
        const target = document.getElementById('ingress-target-' + index)
        if (!target) return true
        const cWidth = target.clientWidth
        const sWidth = target.scrollWidth
        return cWidth > sWidth || cWidth === sWidth
      }
    }
  }

</script>
