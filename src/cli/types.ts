// ====== 项目部署配置 ======

export interface DeployerConfig {
  /** 产品标识 */
  id: string;
  /** Docker 镜像名 */
  image: string;
  /** 前端端口 */
  frontendPort: number;
  /** 后端端口 */
  backendPort: number;
  /** 额外端口 */
  extraPorts?: number[];
  /** 环境变量生成器 */
  envVars(brand: any): Record<string, string>;
  /** 特殊部署前的钩子 */
  beforeDeploy?(brand: any): Promise<void>;
}

/** 注册一个 deployer */
export function defineDeployer(config: DeployerConfig): DeployerConfig {
  return config;
}
