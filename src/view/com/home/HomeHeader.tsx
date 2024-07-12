import React from 'react'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {FeedSourceInfo} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {NavigationProp} from 'lib/routes/types'
import {isWeb} from 'platform/detection'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from '../pager/TabBar'
import {HomeHeaderLayout} from './HomeHeaderLayout'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: FeedSourceInfo[]
  },
) {
  const {feeds} = props
  const {hasSession} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const pal = usePalette('default')

  const hasPinnedCustom = React.useMemo<boolean>(() => {
    if (!hasSession) return false
    return feeds.some(tab => {
      const isFollowing = tab.uri === 'following'
      return !isFollowing
    })
  }, [feeds, hasSession])

  const items = React.useMemo(() => {
    const pinnedNames = feeds.map(f => f.displayName)
    const updatedItems = [...pinnedNames]

    // Check if "Media" should be added as a tab
    const hasMedia = feeds.some(tab => tab.uri === 'media')
    if (hasMedia) {
      updatedItems.push('Media')
    }

    // Optionally add "Feeds" tab if not already included
    if (!hasPinnedCustom) {
      updatedItems.push('Feeds ✨')
    }

    return updatedItems
  }, [feeds, hasPinnedCustom])

  const onPressFeedsLink = React.useCallback(() => {
    if (isWeb) {
      navigation.navigate('Feeds')
    } else {
      navigation.navigate('FeedsTab')
      navigation.popToTop()
    }
  }, [navigation])

  const onSelect = React.useCallback(
    (index: number) => {
      // Navigate to "Feeds" or handle custom logic for other tabs
      if (index === items.length - 1 && items[index] === 'Feeds ✨') {
        onPressFeedsLink()
      } else if (items[index] === 'Media') {
        navigation.navigate('Feeds')
        navigation.popToTop() // Optionally reset stack to the top
      } else if (props.onSelect) {
        props.onSelect(index)
      }
    },
    [items, onPressFeedsLink, navigation, props],
  )

  return (
    <HomeHeaderLayout tabBarAnchor={props.tabBarAnchor}>
      <TabBar
        key={items.join(',')}
        onPressSelected={props.onPressSelected}
        selectedPage={props.selectedPage}
        onSelect={onSelect}
        testID={props.testID}
        items={items}
        indicatorColor={pal.colors.link}
      />
    </HomeHeaderLayout>
  )
}
