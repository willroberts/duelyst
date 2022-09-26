###
# Custom Error Classes
#
# @module custom_errors
###

class NotFoundError extends Error
	constructor: (message = "Not Found.") ->
		super(message)
		@name = "NotFoundError"
		@status = 404
		@description = "The requested resource cannot be found."
		Error.captureStackTrace(this, NotFoundError)

class BadRequestError extends Error
	constructor: (message = "Bad Request.") ->
		super(message)
		@name = "BadRequestError"
		@status = 400
		@description = "The request you made is invalid."
		Error.captureStackTrace(this, BadRequestError)

class UnauthorizedError extends Error
	constructor: (message = "Not Authorized.") ->
		super(message)
		@name = "UnauthorizedError"
		@status = 401
		@description = "You are not authorized to access this resource."
		Error.captureStackTrace(this, UnauthorizedError)

class UnverifiedEmailError extends Error
	constructor: (message = "Email not verified.") ->
		super(message)
		@name = "UnverifiedEmailError"
		@status = 400
		@description = "Unable to process request without a verified email."
		Error.captureStackTrace(this, UnverifiedEmailError)

class BadPasswordError extends Error
	constructor: (message) ->
		super(message)
		@name = "BadPasswordError"
		Error.captureStackTrace(this, BadPasswordError)

class AccountDisabled extends Error
	constructor: (message = "Account Is Disabled.") ->
		super(message)
		@name = "AccountDisabled"
		@status = 401
		Error.captureStackTrace(this, AccountDisabled)

class AlreadyExistsError extends Error
	constructor: (message) ->
		super(message)
		@name = "AlreadyExistsError"
		@status = 400
		Error.captureStackTrace(this, AlreadyExistsError)

class FirebaseTransactionDidNotCommitError extends Error
	constructor:(message)->
		super(message)
		@name = "FirebaseTransactionDidNotCommitError"
		Error.captureStackTrace(this, FirebaseTransactionDidNotCommitError)

class QuestCantBeMulliganedError extends Error
	constructor: (message) ->
		super(message)
		@name = "QuestCantBeMulliganedError"
		Error.captureStackTrace(this, QuestCantBeMulliganedError)

class NoNeedForNewBeginnerQuestsError extends Error
	constructor: (message) ->
		super(message)
		@name = "NoNeedForNewBeginnerQuestsError"
		Error.captureStackTrace(this, NoNeedForNewBeginnerQuestsError)

class InsufficientFundsError extends Error
	constructor: (message) ->
		super(message)
		@name = "InsufficientFundsError"
		@status = 400
		Error.captureStackTrace(this, InsufficientFundsError)

class InvalidInviteCodeError extends Error
	constructor: (message) ->
		super(message)
		@name = "InvalidInviteCodeError"
		@status = 400
		Error.captureStackTrace(this, InvalidInviteCodeError)

class MatchmakingOfflineError extends Error
	constructor: (message) ->
		super(message)
		@name = "MatchmakingOfflineError"
		Error.captureStackTrace(this, MatchmakingOfflineError)

class InvalidDeckError extends Error
	constructor: (message) ->
		super(message)
		@name = "InvalidDeckError"
		Error.captureStackTrace(this, InvalidDeckError)

class NoArenaDeckError extends Error
	constructor: (message) ->
		super(message)
		@name = "NoArenaDeckError"
		Error.captureStackTrace(this, NoArenaDeckError)

class ArenaRewardsAlreadyClaimedError extends Error
	constructor: (message) ->
		super(message)
		@name = "ArenaRewardsAlreadyClaimedError"
		Error.captureStackTrace(this, ArenaRewardsAlreadyClaimedError)

class InvalidRequestError extends Error
	constructor: (message) ->
		super(message)
		@name = "InvalidRequestError"
		Error.captureStackTrace(this, InvalidRequestError)

class UnexpectedBadDataError extends Error
	constructor: (message) ->
		super(message)
		@name = "UnexpectedBadDataError"
		Error.captureStackTrace(this, UnexpectedBadDataError)

class InvalidReferralCodeError extends Error
	constructor: (message) ->
		super(message)
		@name = "InvalidReferralCodeError"
		Error.captureStackTrace(this, InvalidReferralCodeError)

class MaxFactionXPForSinglePlayerReachedError extends Error
	constructor: (message) ->
		super(message)
		@name = "MaxFactionXPForSinglePlayerReachedError"
		Error.captureStackTrace(this, MaxFactionXPForSinglePlayerReachedError)

class SinglePlayerModeDisabledError extends Error
	constructor: (message) ->
		super(message)
		@name = "SinglePlayerModeDisabledError"
		Error.captureStackTrace(this, SinglePlayerModeDisabledError)

class UnverifiedCaptchaError extends Error
	constructor: (message) ->
		super(message)
		@name = "UnverifiedCaptchaError"
		Error.captureStackTrace(this, UnverifiedCaptchaError)

class DailyChallengeTimeFrameError extends Error
	constructor: (message) ->
		super(message)
		@name = "DailyChallengeTimeFrameError"
		Error.captureStackTrace(this, DailyChallengeTimeFrameError)

class ChestAndKeyTypeDoNotMatchError extends Error
	constructor: (message) ->
		super(message)
		@name = "ChestAndKeyTypeDoNotMatchError"
		Error.captureStackTrace(this, ChestAndKeyTypeDoNotMatchError)

# TODO: Do we need to do this? Seems odd if we ever want to let users buy multiples, current spec has it maxing out at 5, maybe that should just be for free chest
class MaxQuantityOfChestTypeError extends Error
	constructor: (message) ->
		super(message)
		@name = "MaxQuantityOfChestTypeError"
		Error.captureStackTrace(this, MaxQuantityOfChestTypeError)

class SystemDisabledError extends Error
	constructor: (message = "This system is currently disabled.") ->
		super(message)
		@name = "SystemDisabledError"
		@status = 400
		@description = "This system is currently disabled."
		Error.captureStackTrace(this, SystemDisabledError)

class MaxOrbsForSetReachedError extends Error
	constructor: (message) ->
		super(message)
		@name = "MaxOrbsForSetReachedError"
		Error.captureStackTrace(this, MaxOrbsForSetReachedError)

class BossEventNotFound extends Error
	constructor: (message) ->
		super(message)
		@name = "BossEventNotFound"
		Error.captureStackTrace(this, BossEventNotFound)

class MaxRiftUpgradesReachedError extends Error
	constructor: (message) ->
		super(message)
		@name = "MaxRiftUpgradesReachedError"
		Error.captureStackTrace(this, MaxRiftUpgradesReachedError)

class ShopSaleDoesNotExistError extends Error
	constructor: (message) ->
		super(message)
		@name = "ShopSaleDoesNotExistError"
		Error.captureStackTrace(this, ShopSaleDoesNotExistError)

module.exports.NotFoundError = NotFoundError
module.exports.BadRequestError = BadRequestError
module.exports.UnauthorizedError = UnauthorizedError
module.exports.BadPasswordError = BadPasswordError
module.exports.AccountDisabled = AccountDisabled
module.exports.AlreadyExistsError = AlreadyExistsError
module.exports.QuestCantBeMulliganedError = QuestCantBeMulliganedError
module.exports.NoNeedForNewBeginnerQuestsError = NoNeedForNewBeginnerQuestsError
module.exports.FirebaseTransactionDidNotCommitError = FirebaseTransactionDidNotCommitError
module.exports.InsufficientFundsError = InsufficientFundsError
module.exports.InvalidInviteCodeError = InvalidInviteCodeError
module.exports.MatchmakingOfflineError = MatchmakingOfflineError
module.exports.InvalidDeckError = InvalidDeckError
module.exports.NoArenaDeckError = NoArenaDeckError
module.exports.ArenaRewardsAlreadyClaimedError = ArenaRewardsAlreadyClaimedError
module.exports.InvalidRequestError = InvalidRequestError
module.exports.UnexpectedBadDataError = UnexpectedBadDataError
module.exports.InvalidReferralCodeError = InvalidReferralCodeError
module.exports.MaxFactionXPForSinglePlayerReachedError = MaxFactionXPForSinglePlayerReachedError
module.exports.SinglePlayerModeDisabledError = SinglePlayerModeDisabledError
module.exports.UnverifiedCaptchaError = UnverifiedCaptchaError
module.exports.UnverifiedEmailError = UnverifiedEmailError
module.exports.DailyChallengeTimeFrameError = DailyChallengeTimeFrameError
module.exports.ChestAndKeyTypeDoNotMatchError = ChestAndKeyTypeDoNotMatchError
module.exports.MaxQuantityOfChestTypeError = MaxQuantityOfChestTypeError
module.exports.SystemDisabledError = SystemDisabledError
module.exports.MaxOrbsForSetReachedError = MaxOrbsForSetReachedError
module.exports.BossEventNotFound = BossEventNotFound
module.exports.MaxRiftUpgradesReachedError = MaxRiftUpgradesReachedError
module.exports.ShopSaleDoesNotExistError = ShopSaleDoesNotExistError
