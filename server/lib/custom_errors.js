/* eslint-disable
    max-classes-per-file,
    max-len,
    no-param-reassign,
    no-this-before-super,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
/*
 * Custom Error Classes
 *
 * @module custom_errors
 */

class NotFoundError extends Error {
  constructor(message) {
    if (message == null) { message = 'Not Found.'; }
    this.message = message;
    this.name = 'NotFoundError';
    this.status = 404;
    this.description = 'The requested resource cannot be found.';
    Error.captureStackTrace(this, NotFoundError);
    super(this.message);
  }
}

class BadRequestError extends Error {
  constructor(message) {
    if (message == null) { message = 'Bad Request.'; }
    this.message = message;
    this.name = 'BadRequestError';
    this.status = 400;
    this.description = 'The request you made is invalid.';
    Error.captureStackTrace(this, BadRequestError);
    super(this.message);
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    if (message == null) { message = 'Not Authorized.'; }
    this.message = message;
    this.name = 'UnauthorizedError';
    this.status = 401;
    this.description = 'You are not authorized to access this resource.';
    Error.captureStackTrace(this, UnauthorizedError);
    super(this.message);
  }
}

class UnverifiedEmailError extends Error {
  constructor(message) {
    if (message == null) { message = 'Email not verified.'; }
    this.message = message;
    this.name = 'UnverifiedEmailError';
    this.status = 400;
    this.description = 'Unable to process request without a verified email.';
    Error.captureStackTrace(this, UnverifiedEmailError);
    super(this.message);
  }
}

class BadPasswordError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'BadPasswordError';
    Error.captureStackTrace(this, BadPasswordError);
    super(this.message);
  }
}

class AccountDisabled extends Error {
  constructor(message) {
    if (message == null) { message = 'Account Is Disabled.'; }
    this.message = message;
    this.name = 'AccountDisabled';
    this.status = 401;
    Error.captureStackTrace(this, AccountDisabled);
    super(this.message);
  }
}

class AlreadyExistsError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'AlreadyExistsError';
    this.status = 400;
    Error.captureStackTrace(this, AlreadyExistsError);
    super(this.message);
  }
}

class FirebaseTransactionDidNotCommitError extends Error {
  constructor(message) {
    this.name = 'FirebaseTransactionDidNotCommitError';
    Error.captureStackTrace(this, FirebaseTransactionDidNotCommitError);
    super(this.message);
  }
}

class QuestCantBeMulliganedError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'QuestCantBeMulliganedError';
    Error.captureStackTrace(this, QuestCantBeMulliganedError);
    super(this.message);
  }
}

class NoNeedForNewBeginnerQuestsError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'NoNeedForNewBeginnerQuestsError';
    Error.captureStackTrace(this, NoNeedForNewBeginnerQuestsError);
    super(this.message);
  }
}

class InsufficientFundsError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'InsufficientFundsError';
    this.status = 400;
    Error.captureStackTrace(this, InsufficientFundsError);
    super(this.message);
  }
}

class InvalidInviteCodeError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'InvalidInviteCodeError';
    this.status = 400;
    Error.captureStackTrace(this, InvalidInviteCodeError);
    super(this.message);
  }
}

class MatchmakingOfflineError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'MatchmakingOfflineError';
    Error.captureStackTrace(this, MatchmakingOfflineError);
    super(this.message);
  }
}

class InvalidDeckError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'InvalidDeckError';
    Error.captureStackTrace(this, InvalidDeckError);
    super(this.message);
  }
}

class NoArenaDeckError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'NoArenaDeckError';
    Error.captureStackTrace(this, NoArenaDeckError);
    super(this.message);
  }
}

class ArenaRewardsAlreadyClaimedError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'ArenaRewardsAlreadyClaimedError';
    Error.captureStackTrace(this, ArenaRewardsAlreadyClaimedError);
    super(this.message);
  }
}

class InvalidRequestError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'InvalidRequestError';
    Error.captureStackTrace(this, InvalidRequestError);
    super(this.message);
  }
}

class UnexpectedBadDataError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'UnexpectedBadDataError';
    Error.captureStackTrace(this, UnexpectedBadDataError);
    super(this.message);
  }
}

class InvalidReferralCodeError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'InvalidReferralCodeError';
    Error.captureStackTrace(this, InvalidReferralCodeError);
    super(this.message);
  }
}

class MaxFactionXPForSinglePlayerReachedError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'MaxFactionXPForSinglePlayerReachedError';
    Error.captureStackTrace(this, MaxFactionXPForSinglePlayerReachedError);
    super(this.message);
  }
}

class SinglePlayerModeDisabledError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'SinglePlayerModeDisabledError';
    Error.captureStackTrace(this, SinglePlayerModeDisabledError);
    super(this.message);
  }
}

class UnverifiedCaptchaError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'UnverifiedCaptchaError';
    Error.captureStackTrace(this, UnverifiedCaptchaError);
    super(this.message);
  }
}

class DailyChallengeTimeFrameError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'DailyChallengeTimeFrameError';
    Error.captureStackTrace(this, DailyChallengeTimeFrameError);
    super(this.message);
  }
}

class ChestAndKeyTypeDoNotMatchError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'ChestAndKeyTypeDoNotMatchError';
    Error.captureStackTrace(this, ChestAndKeyTypeDoNotMatchError);
    super(this.message);
  }
}

// TODO: Do we need to do this? Seems odd if we ever want to let users buy multiples, current spec has it maxing out at 5, maybe that should just be for free chest
class MaxQuantityOfChestTypeError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'MaxQuantityOfChestTypeError';
    Error.captureStackTrace(this, MaxQuantityOfChestTypeError);
    super(this.message);
  }
}

class SystemDisabledError extends Error {
  constructor(message) {
    if (message == null) { message = 'This system is currently disabled.'; }
    this.message = message;
    this.name = 'SystemDisabledError';
    this.status = 400;
    this.description = 'This system is currently disabled.';
    Error.captureStackTrace(this, SystemDisabledError);
    super(this.message);
  }
}

class MaxOrbsForSetReachedError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'MaxOrbsForSetReachedError';
    Error.captureStackTrace(this, MaxOrbsForSetReachedError);
    super(this.message);
  }
}

class BossEventNotFound extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'BossEventNotFound';
    Error.captureStackTrace(this, BossEventNotFound);
    super(this.message);
  }
}

class MaxRiftUpgradesReachedError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'MaxRiftUpgradesReachedError';
    Error.captureStackTrace(this, MaxRiftUpgradesReachedError);
    super(this.message);
  }
}

class ShopSaleDoesNotExistError extends Error {
  constructor(message) {
    this.message = message;
    this.name = 'ShopSaleDoesNotExistError';
    Error.captureStackTrace(this, ShopSaleDoesNotExistError);
    super(this.message);
  }
}

module.exports.NotFoundError = NotFoundError;
module.exports.BadRequestError = BadRequestError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.BadPasswordError = BadPasswordError;
module.exports.AccountDisabled = AccountDisabled;
module.exports.AlreadyExistsError = AlreadyExistsError;
module.exports.QuestCantBeMulliganedError = QuestCantBeMulliganedError;
module.exports.NoNeedForNewBeginnerQuestsError = NoNeedForNewBeginnerQuestsError;
module.exports.FirebaseTransactionDidNotCommitError = FirebaseTransactionDidNotCommitError;
module.exports.InsufficientFundsError = InsufficientFundsError;
module.exports.InvalidInviteCodeError = InvalidInviteCodeError;
module.exports.MatchmakingOfflineError = MatchmakingOfflineError;
module.exports.InvalidDeckError = InvalidDeckError;
module.exports.NoArenaDeckError = NoArenaDeckError;
module.exports.ArenaRewardsAlreadyClaimedError = ArenaRewardsAlreadyClaimedError;
module.exports.InvalidRequestError = InvalidRequestError;
module.exports.UnexpectedBadDataError = UnexpectedBadDataError;
module.exports.InvalidReferralCodeError = InvalidReferralCodeError;
module.exports.MaxFactionXPForSinglePlayerReachedError = MaxFactionXPForSinglePlayerReachedError;
module.exports.SinglePlayerModeDisabledError = SinglePlayerModeDisabledError;
module.exports.UnverifiedCaptchaError = UnverifiedCaptchaError;
module.exports.UnverifiedEmailError = UnverifiedEmailError;
module.exports.DailyChallengeTimeFrameError = DailyChallengeTimeFrameError;
module.exports.ChestAndKeyTypeDoNotMatchError = ChestAndKeyTypeDoNotMatchError;
module.exports.MaxQuantityOfChestTypeError = MaxQuantityOfChestTypeError;
module.exports.SystemDisabledError = SystemDisabledError;
module.exports.MaxOrbsForSetReachedError = MaxOrbsForSetReachedError;
module.exports.BossEventNotFound = BossEventNotFound;
module.exports.MaxRiftUpgradesReachedError = MaxRiftUpgradesReachedError;
module.exports.ShopSaleDoesNotExistError = ShopSaleDoesNotExistError;
