import { AppError, missing, forbidden, invalidState } from './errors.js';

// TODO-01~04: 업무 규칙과 트랜잭션을 직접 구현합니다. docs/API.md를 먼저 읽으세요.
// actor는 검증된 로그인 사용자입니다. repo의 저장 함수는 권한을 검사하지 않습니다.
// 상태 변경과 이력 저장은 함께 성공하거나 함께 실패해야 합니다.
// 승인 취소와 자동 승급은 신청 2건 + 이력 2건을 한 트랜잭션으로 처리합니다.
//
// ── 뼈대 안내 (학습 자료의 같은 번호를 같이 보세요) ──
// 검사 순서는 모든 함수에서 같습니다: 대상 존재(404) → 권한(403) → 상태(409) → 정원(409)
// (인증 401과 ID·본문 형식 400은 app.js가 이미 처리해서, 여기 들어오는 값은 검증된 상태입니다)

export function createApplicationService(repo) {
  const db = repo.db;

  // [S0] 트랜잭션 도우미
  //   fn을 BEGIN ~ COMMIT 사이에서 실행하고, fn이 throw하면 ROLLBACK 후 같은 에러를 다시 throw.
  //   fn의 반환값을 그대로 반환.
  //   학습 자료: 2장 트랜잭션, 3장 BEGIN 종류
  function tx(fn) {
    // 채울 부분 (지금은 트랜잭션 없이 그냥 실행만 함)
    return fn();
  }

  // [S1] 이 행사의 담당 운영자인가?
  //   역할이 MANAGER이고, 행사의 managerId가 actor.id와 같을 때만 true
  function isManagerOf(actor, event) {
    return false; // ← 채울 부분
  }

  return {
    apply(actor, eventId) {
      // TODO-01: 행사·학생 역할·중복 검사 → PENDING 저장 + APPLY 이력.
      // 취소·승인 취소 기록도 중복입니다. 반환: 신청 객체.
      //   [A1] 행사 존재        repo.event       없으면 missing('행사')
      //   [A2] 학생인가         actor.role       아니면 forbidden()
      //   [A3] 중복             repo.existing    있으면 409 ALREADY_APPLIED (AppError 직접 생성)
      //                         ※ 상태와 상관없이 "행이 있으면" 중복
      //   [A4] 저장             repo.insert      → 신청 객체
      //   [A5] 이력             repo.addHistory  action APPLY, fromStatus 없음, toStatus PENDING
      //   [A6] A1~A5 전체를 tx()로 감싸기
      throw new AppError(501,'NOT_IMPLEMENTED','TODO-01 신청과 이력 저장을 구현하세요.');
    },
    cancel(actor, applicationId) {
      // TODO-02: 본인의 PENDING만 CANCELLED로 변경 + CANCEL 이력.
      // 학생의 대기 취소는 승인 자리를 비우지 않으므로 자동 승급하지 않습니다.
      //   [C1] 신청 존재        repo.application
      //   [C2] 본인인가         신청의 userId vs actor.id   (운영자도 여기서 403)
      //   [C3] 상태             PENDING이 아니면 invalidState()
      //   [C4] 저장 + 이력      setStatus → addHistory(CANCEL, PENDING → CANCELLED)
      //   [C5] tx()로 감싸기
      throw new AppError(501,'NOT_IMPLEMENTED','TODO-02 대기 취소와 이력을 구현하세요.');
    },
    approve(actor, applicationId) {
      // TODO-03: 담당자·PENDING·정원 검사 → APPROVED + APPROVE 이력.
      // 직접 승인은 운영자가 선택합니다. FIFO는 승인 취소 때의 자동 승급에 적용합니다.
      //   [P1] 신청 존재
      //   [P2] 담당자인가       신청 → 행사를 찾아서 isManagerOf
      //   [P3] 상태             PENDING만
      //   [P4] 정원             repo.approvedCount 가 capacity 이상이면 409 CAPACITY_FULL
      //   [P5] 저장 + 이력      APPROVE, PENDING → APPROVED
      //   [P6] tx()로 감싸기
      throw new AppError(501,'NOT_IMPLEMENTED','TODO-03 승인과 이력을 구현하세요.');
    },
    revoke(actor, applicationId, reason) {
      // TODO-04: 담당자·APPROVED 검사 → REVOKED + REVOKE 이력.
      // 같은 행사 PENDING 중 created_at ASC, id ASC 첫 1건을 자동 승인합니다.
      // AUTO_APPROVE 이력의 causeHistoryId는 이 요청의 REVOKE 이력 ID입니다.
      // 상태와 이력의 부분 저장을 막고, 거부·오류 시 전체를 되돌리세요.
      // 반환: {revoked: 신청 객체, promoted: 신청 객체 또는 null}.
      //   [V1] 신청 존재 → [V2] 담당자 → [V3] APPROVED만 (reason은 app.js가 이미 trim·길이 검사 완료)
      //   [V4] REVOKED 저장 + REVOKE 이력 (reason 포함)  ← addHistory의 반환값(이력 ID)을 변수에 받아두기
      //   [V5] 다음 대기자 1명 찾기      repo.nextPending (repository.js의 TODO R1)
      //   [V6] 있으면 APPROVED 저장 + AUTO_APPROVE 이력 (actorId = 이 운영자, causeHistoryId = V4의 ID)
      //        없으면 promoted = null
      //   [V7] V1~V6 전체를 tx() 하나로
      throw new AppError(501,'NOT_IMPLEMENTED','TODO-04 승인 취소·자동 승급·이력을 구현하세요.');
    }
  };
}
