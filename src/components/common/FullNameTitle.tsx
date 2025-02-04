import type { FC } from '../../lib/teact/teact';
import React, { memo, useMemo } from '../../lib/teact/teact';
import { getActions } from '../../global';

import type {
  ApiPeer,
} from '../../api/types';
import type { ObserveFn } from '../../hooks/useIntersectionObserver';
import type { CustomPeer } from '../../types';

import { EMOJI_STATUS_LOOP_LIMIT } from '../../config';
import {
  getChatTitle, getUserFullName, isAnonymousForwardsChat, isChatWithRepliesBot, isPeerUser,
} from '../../global/helpers';
import buildClassName from '../../util/buildClassName';
import { copyTextToClipboard } from '../../util/clipboard';
import stopEvent from '../../util/stopEvent';
import renderText from './helpers/renderText';

import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';

import CustomEmoji from './CustomEmoji';
import FakeIcon from './FakeIcon';
import StarIcon from './icons/StarIcon';
import VerifiedIcon from './VerifiedIcon';

import styles from './FullNameTitle.module.scss';

type OwnProps = {
  peer: ApiPeer | CustomPeer;
  className?: string;
  noVerified?: boolean;
  noFake?: boolean;
  withEmojiStatus?: boolean;
  emojiStatusSize?: number;
  isSavedMessages?: boolean;
  isSavedDialog?: boolean;
  noLoopLimit?: boolean;
  canCopyTitle?: boolean;
  iconElement?: React.ReactNode;
  allowMultiLine?: boolean;
  onEmojiStatusClick?: NoneToVoidFunction;
  observeIntersection?: ObserveFn;
};

const FullNameTitle: FC<OwnProps> = ({
  className,
  peer,
  noVerified,
  noFake,
  withEmojiStatus,
  emojiStatusSize,
  isSavedMessages,
  isSavedDialog,
  noLoopLimit,
  canCopyTitle,
  iconElement,
  allowMultiLine,
  onEmojiStatusClick,
  observeIntersection,
}) => {
  const lang = useOldLang();
  const { showNotification } = getActions();
  const realPeer = 'id' in peer ? peer : undefined;
  const customPeer = 'isCustomPeer' in peer ? peer : undefined;
  const isUser = realPeer && isPeerUser(realPeer);
  const title = realPeer && (isUser ? getUserFullName(realPeer) : getChatTitle(lang, realPeer));
  const isPremium = isUser && realPeer.isPremium;

  const handleTitleClick = useLastCallback((e) => {
    if (!title || !canCopyTitle) {
      return;
    }

    stopEvent(e);
    copyTextToClipboard(title);
    showNotification({ message: `${isUser ? 'User' : 'Chat'} name was copied` });
  });

  const specialTitle = useMemo(() => {
    if (customPeer) {
      return customPeer.title || lang(customPeer.titleKey!);
    }

    if (isSavedMessages) {
      return lang(isSavedDialog ? 'MyNotes' : 'SavedMessages');
    }

    if (isAnonymousForwardsChat(realPeer!.id)) {
      return lang('AnonymousForward');
    }

    if (isChatWithRepliesBot(realPeer!.id)) {
      return lang('RepliesTitle');
    }

    return undefined;
  }, [customPeer, isSavedDialog, isSavedMessages, lang, realPeer]);

  if (specialTitle) {
    return (
      <div className={buildClassName('title', styles.root, className)}>
        <h3 className={buildClassName('fullName', styles.fullName, !allowMultiLine && styles.ellipsis)}>
          {specialTitle}
        </h3>
      </div>
    );
  }

  return (
    <div className={buildClassName('title', styles.root, className)}>
      <h3
        dir="auto"
        role="button"
        className={buildClassName(
          'fullName',
          styles.fullName,
          !allowMultiLine && styles.ellipsis,
          canCopyTitle && styles.canCopy,
        )}
        onClick={handleTitleClick}
      >
        {renderText(title || '')}
      </h3>
      {!iconElement && peer && (
        <>
          {!noVerified && peer?.isVerified && <VerifiedIcon />}
          {!noFake && peer?.fakeType && <FakeIcon fakeType={peer.fakeType} />}
          {withEmojiStatus && realPeer?.emojiStatus && (
            <CustomEmoji
              documentId={realPeer.emojiStatus.documentId}
              size={emojiStatusSize}
              loopLimit={!noLoopLimit ? EMOJI_STATUS_LOOP_LIMIT : undefined}
              observeIntersectionForLoading={observeIntersection}
              onClick={onEmojiStatusClick}
            />
          )}
          {withEmojiStatus && !realPeer?.emojiStatus && isPremium && <StarIcon />}
        </>
      )}
      {iconElement}
    </div>
  );
};

export default memo(FullNameTitle);
