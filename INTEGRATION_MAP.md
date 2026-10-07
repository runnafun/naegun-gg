# 내전.GG 실시간 내전 데이터 통합 기준

중요: 화면마다 Prisma를 따로 조회하거나 서로 다른 API를 만들지 않는다.

## 단일 Source of Truth
PostgreSQL / Prisma Scrim + ScrimParticipant

## 공용 데이터 레이어
app/lib/scrims/service.ts

## 공용 Public API
GET /api/scrims
GET /api/scrims/[code]

## 기본 실시간 갱신
일반 사용자 화면: 5초 polling
관리자 화면: 2~3초 polling 권장
Discord Bot: 쓰기 직후 DB 반영하므로 다음 polling에서 사이트에 반영

## 이 데이터 소스를 연결할 화면

1. 메인페이지
- 현재 열려있는 내전
- 일반/랭크 모집 수
- 최근/진행중 내전
- CTA의 현재 모집 인원

2. /matches
- 전체 목록
- NORMAL / RANKED
- OPEN / CLOSED / TEAM_SELECTION / IN_PROGRESS
- 인원수

3. 내전 코드 검색
- /api/scrims/[code]
- 검색 성공 시 상세 페이지로 이동

4. /matches/[code]
- 참가자
- 상태
- 팀 A/B
- 게임 진행상태
- 룰/BO3

5. /admin/scrims
- 전체 내전 관리 목록
- 상태 필터
- 인원
- 팀배정 여부
- 상세관리 링크

6. /admin/scrims/[code]
- 현재 만든 자동 팀 배정
- 참가자 변경사항 실시간 갱신
- 팀 확정 결과

7. 프로필
- 유저의 참가/완료 내전 기록
- 별도 userId filter를 같은 service에 추가해 사용

8. 랭킹 / 통계
- 완료된 Scrim / Game 결과 기반 집계
- 목록 API를 재활용하지 말고 통계 서비스에서 같은 DB를 source로 사용

9. Discord Bot
- 봇은 기존 /api/bot/* 쓰기 API 유지
- 웹 public API와 bot secret API를 섞지 않음

## 절대 하지 않을 것
- app/data/matches.ts를 실제 데이터 source로 계속 사용
- 메인용 API, matches용 API, 검색용 API에서 각각 다른 조회 로직 작성
- data.json을 웹 fallback으로 사용
- 브라우저에서 Prisma 직접 접근
- 관리자용 민감 필드를 public API에 노출

## 다음 연결 우선순위
1. /matches
2. 메인 현재 열려있는 내전
3. 내전 코드 검색
4. /matches/[code]
5. /admin/scrims
6. 프로필 내전 기록
7. 랭킹/통계
