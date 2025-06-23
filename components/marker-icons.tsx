/**
 * 방패 모양 마커 아이콘을 생성하는 유틸리티
 * 레벨에 따라 동색(1), 은색(2), 금색(3)으로 구분
 */

export interface MarkerIconConfig {
  level: number;
  isSelected?: boolean;
  size?: number;
}

// 레벨별 색상 정의
const LEVEL_COLORS = {
  1: '#CD7F32', // 동색 (Bronze)
  2: '#C0C0C0', // 은색 (Silver)  
  3: '#FFD700', // 금색 (Gold)
} as const;

// 기본 색상 (레벨이 없거나 유효하지 않은 경우)
const DEFAULT_COLOR = '#6B7280'; // Gray

/**
 * 레벨에 따른 색상 반환
 */
export function getLevelColor(level: number | null | undefined): string {
  if (!level || level < 1 || level > 3) {
    return DEFAULT_COLOR;
  }
  return LEVEL_COLORS[level as keyof typeof LEVEL_COLORS];
}

/**
 * 방패 모양 SVG 아이콘 생성
 */
export function createShieldIcon(config: MarkerIconConfig): string {
  const { level, isSelected = false, size = 24 } = config;
  const fillColor = getLevelColor(level);
  const strokeColor = isSelected ? '#DC2626' : '#FFFFFF';
  const strokeWidth = isSelected ? 3 : 2;
  const actualSize = isSelected ? size * 1.3 : size;

  const svg = `
    <svg width="${actualSize}" height="${actualSize}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="1" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- 방패 배경 -->
      <path 
        d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4z" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
        filter="url(#shadow)"
      />
      
      <!-- 레벨 표시 -->
      <text 
        x="12" 
        y="15" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="8" 
        font-weight="bold" 
        fill="${strokeColor}"
      >
        ${level || '?'}
      </text>
      
      <!-- 선택된 마커 표시 -->
      ${isSelected ? `
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="none" 
          stroke="${strokeColor}" 
          stroke-width="1.5" 
          stroke-dasharray="2,2"
          opacity="0.8"
        />
      ` : ''}
    </svg>
  `;

  // SVG를 data URL로 인코딩
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Google Maps 마커용 아이콘 객체 생성
 */
export function createMarkerIcon(config: MarkerIconConfig): google.maps.Icon {
  const { isSelected = false, size = 24 } = config;
  const actualSize = isSelected ? size * 1.3 : size;
  
  return {
    url: createShieldIcon(config),
    scaledSize: new google.maps.Size(actualSize, actualSize),
    anchor: new google.maps.Point(actualSize / 2, actualSize),
    origin: new google.maps.Point(0, 0),
  };
}

/**
 * 레벨별 색상 정보 (UI 표시용)
 */
export const LEVEL_INFO = {
  1: { color: LEVEL_COLORS[1], name: '동색', description: '기본 안전 레벨' },
  2: { color: LEVEL_COLORS[2], name: '은색', description: '향상된 안전 레벨' },
  3: { color: LEVEL_COLORS[3], name: '금색', description: '최고 안전 레벨' },
} as const;