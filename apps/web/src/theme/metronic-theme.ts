/**
 * Metronic 主题配置
 * 包含颜色、阴影、字体等设计系统配置
 */
export const metronicTheme = {
    colors: {
        primary: '#009EF7',
        success: '#50CD89',
        info: '#7239EA',
        warning: '#FFC700',
        danger: '#F1416C',
        dark: '#181C32',
        muted: '#A1A5B7',
        light: '#F9F9F9',
        white: '#FFFFFF',
        gray100: '#F9F9F9',
        gray200: '#F4F4F4',
        gray300: '#E1E3EA',
        gray400: '#B5B5C3',
        gray500: '#A1A5B7',
        gray600: '#7E8299',
        gray700: '#5E6278',
        gray800: '#3F4254',
        gray900: '#181C32',
    },
    shadows: {
        card: '0 0 50px 0 rgba(82, 63, 105, 0.15)',
        button: '0 0 20px 0 rgba(76, 87, 125, 0.2)',
    },
    fonts: {
        family: 'Inter, Helvetica, "sans-serif"',
    },
    spacing: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        xxl: '32px',
    },
    borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        round: '50%',
    },
} as const;

export type MetronicTheme = typeof metronicTheme;
