import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {logEvent} from '#/lib/statsig/statsig'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {useAnalytics} from 'lib/analytics/analytics'
import {ComposeIcon2} from 'lib/icons'
import {AllNavigatorParams} from 'lib/routes/types'
import {s} from 'lib/styles'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {Feed} from '../posts/Feed'
import {FAB} from '../util/fab/FAB'
import {ListMethods} from '../util/List'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '../util/MainScrollProvider'

const POLL_FREQ = 60e3 // 60 seconds

export function MediaFeedPage({
  testID,
  isPageFocused,
  feed,
  feedParams,
  renderEmptyState,
  renderEndOfFeed,
  savedFeedConfig,
}: // filterPosts, // New prop for filtering posts
{
  testID?: string
  feed: FeedDescriptor
  feedParams?: FeedParams
  isPageFocused: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  savedFeedConfig?: AppBskyActorDefs.SavedFeed
  filterPosts?: (posts: any[]) => any[] // Type of the new prop
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<AllNavigatorParams>>()
  const queryClient = useQueryClient()
  const {openComposer} = useComposerControls()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen, track} = useAnalytics()
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feed, hasSession)
  const scrollElRef = React.useRef<ListMethods>(null)
  const [hasNew, setHasNew] = React.useState(false)

  // Function to scroll to the top of the feed
  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerOffset,
    })
    setMinimalShellMode(false)
  }, [headerOffset, setMinimalShellMode])

  // Function to handle a soft reset
  const onSoftReset = React.useCallback(() => {
    const isScreenFocused =
      getTabState(getRootNavigation(navigation).getState(), 'Home') ===
      TabState.InsideAtRoot
    if (isScreenFocused && isPageFocused) {
      scrollToTop()
      truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
      setHasNew(false)
      logEvent('feed:refresh:sampled', {
        feedType: feed.split('|')[0],
        feedUrl: feed,
        reason: 'soft-reset',
      })
    }
  }, [navigation, isPageFocused, scrollToTop, queryClient, feed, setHasNew])

  // Effect to set up soft reset listener when page is focused
  React.useEffect(() => {
    if (!isPageFocused) {
      return
    }
    screen('Feed')
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, screen, isPageFocused])

  // Function to handle the press of the compose button
  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    openComposer({})
  }, [openComposer, track])

  // Function to handle loading the latest posts
  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
    logEvent('feed:refresh:sampled', {
      feedType: feed.split('|')[0],
      feedUrl: feed,
      reason: 'load-latest',
    })
  }, [scrollToTop, feed, queryClient, setHasNew])

  // Function to filter media posts
  const filterMediaPosts = (posts: AppBskyFeedDefs.PostView[]) => {
    return posts.filter(post => post.embed !== undefined)
  }

  return (
    <View testID={testID} style={s.h100pct}>
      <MainScrollProvider>
        <FeedFeedbackProvider value={feedFeedback}>
          <Feed
            testID={testID ? `${testID}-feed` : undefined}
            enabled={isPageFocused}
            feed={feed}
            feedParams={feedParams}
            pollInterval={POLL_FREQ}
            disablePoll={hasNew}
            scrollElRef={scrollElRef}
            onScrolledDownChange={setIsScrolledDown}
            onHasNew={setHasNew}
            renderEmptyState={renderEmptyState}
            renderEndOfFeed={renderEndOfFeed}
            headerOffset={headerOffset}
            savedFeedConfig={savedFeedConfig}
            filterPosts={filterMediaPosts} // Apply the filter
          />
        </FeedFeedbackProvider>
      </MainScrollProvider>

      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
        />
      )}

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg({message: `New post`, context: 'action'}))}
          accessibilityHint=""
        />
      )}
    </View>
  )
}
