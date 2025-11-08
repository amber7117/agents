import { prisma } from '@pkg/db';

/**
 * 初始化数据库表和默认数据
 */
async function initializeDatabase() {
    console.log('🚀 开始初始化数据库...');

    try {
        // 1. 创建默认的全局模块设置
        console.log('📝 创建全局模块设置...');
        const existingModuleSettings = await prisma.moduleSettings.findFirst({
            where: { userId: null }
        }).catch(() => null);

        if (!existingModuleSettings) {
            await prisma.moduleSettings.create({
                data: {
                    userId: null,
                    aiEnabled: true
                }
            });
            console.log('✅ 创建了默认的全局模块设置');
        } else {
            console.log('ℹ️ 全局模块设置已存在');
        }

        // 2. 创建默认的全局AI配置
        console.log('🤖 创建全局AI配置...');
        const existingAIConfig = await prisma.aIConfig.findFirst({
            where: { userId: null, enabled: true }
        }).catch(() => null);

        if (!existingAIConfig) {
            await prisma.aIConfig.create({
                data: {
                    userId: null,
                    provider: 'OPENAI',
                    model: 'gpt-4o',
                    temperature: 0.7,
                    topP: 1.0,
                    frequencyPenalty: 0.0,
                    presencePenalty: 0.0,
                    maxTokens: 4096,
                    systemPrompt: '你是一个友好且高效的AI助手。',
                    language: 'zh-CN',
                    dailyBudgetUSD: 1.00,
                    enabled: true
                }
            });
            console.log('✅ 创建了默认的全局AI配置');
        } else {
            console.log('ℹ️ 全局AI配置已存在');
        }

        // 3. 创建示例智能体模板
        console.log('🎭 创建智能体模板...');
        const existingTemplate = await prisma.agentTemplate.findFirst().catch(() => null);

        if (!existingTemplate) {
            await prisma.agentTemplate.create({
                data: {
                    name: '默认助手',
                    description: '通用AI助手模板',
                    prompt: '你是一个友好、专业且乐于助人的AI助手。请根据用户的问题提供准确、有用的回答。',
                    temperature: 0.7,
                    provider: 'OPENAI',
                    model: 'gpt-3.5-turbo',
                    isGlobal: true
                }
            });
            console.log('✅ 创建了默认的智能体模板');
        } else {
            console.log('ℹ️ 智能体模板已存在');
        }

        console.log('🎉 数据库初始化完成！');
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('数据库初始化成功');
            process.exit(0);
        })
        .catch((error) => {
            console.error('数据库初始化失败:', error);
            process.exit(1);
        });
}

export { initializeDatabase };
