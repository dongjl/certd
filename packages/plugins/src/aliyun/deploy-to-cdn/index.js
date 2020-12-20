import { AbstractAliyunPlugin } from '../../aliyun/abstract-aliyun.js'
import Core from '@alicloud/pop-core'
import dayjs from 'dayjs'
export class DeployCertToAliyunCDN extends AbstractAliyunPlugin {
  /**
   * 插件定义
   * 名称
   * 入参
   * 出参
   */
  static define () {
    return {
      name: 'deployCertToAliyunCDN',
      label: '部署到阿里云CDN',
      input: {
        domainName: {
          label: 'cdn加速域名',
          required: true
        },
        certName: {
          label: '证书名称'
        },
        certType: {
          value: 'upload',
          label: '证书来源',
          options: [
            { value: 'upload', label: '直接上传' },
            { value: 'cas', label: '从证书库', desc: '需要uploadCertToAliyun作为前置任务' }
          ],
          required: true
        },
        // serverCertificateStatus: {
        //   label: '启用https',
        //   options: [
        //     { value: 'on', label: '开启HTTPS，并更新证书' },
        //     { value: 'auto', label: '若HTTPS开启则更新，未开启不更新' }
        //   ],
        //   required:true
        // },
        accessProvider: {
          label: 'Access提供者',
          type: [String, Object],
          desc: 'AccessProviders的key 或 一个包含accessKeyId与accessKeySecret的对象',
          options: 'accessProviders[type=aliyun]',
          required: true
        }
      },
      output: {

      }
    }
  }

  async execute ({ accessProviders, cert, args, context }) {
    const accessProvider = this.getAccessProvider(args.accessProvider, accessProviders)
    const client = this.getClient(accessProvider)
    const params = this.buildParams(args, context, cert)
    await this.doRequest(client, params)
  }

  getClient (aliyunProvider) {
    return new Core({
      accessKeyId: aliyunProvider.accessKeyId,
      accessKeySecret: aliyunProvider.accessKeySecret,
      endpoint: 'https://cdn.aliyuncs.com',
      apiVersion: '2018-05-10'
    })
  }

  buildParams (args, context, cert) {
    const { certName, certType, domainName } = args
    const CertName = certName + '-' + dayjs().format('YYYYMMDDHHmmss')

    const params = {
      RegionId: 'cn-hangzhou',
      DomainName: domainName,
      ServerCertificateStatus: 'on',
      CertName: CertName,
      CertType: certType,
      ServerCertificate: super.format(cert.crt.toString()),
      PrivateKey: super.format(cert.key.toString())
    }
    return params
  }

  async doRequest (client, params) {
    const requestOption = {
      method: 'POST'
    }
    const ret = await client.request('SetDomainServerCertificate', params, requestOption)
    this.checkRet(ret)
    this.logger.info('设置cdn证书成功:', ret.RequestId)
  }
}
