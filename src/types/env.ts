/**
 * 环境变量类型定义
 */
export interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // OpenAI Configuration
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
  OPENAI_MODEL: string;
}

/**
 * 验证必需的环境变量是否已配置
 */
export function validateEnvConfig(config: Partial<EnvConfig>): {
  isValid: boolean;
  missingVars: string[];
  config: EnvConfig;
} {
  const requiredVars: (keyof EnvConfig)[] = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!config[varName] || config[varName]!.trim() === "") {
      missingVars.push(varName);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    config: config as EnvConfig,
  };
}
