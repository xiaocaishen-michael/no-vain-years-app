import { ScrollView, Text } from 'react-native';

const COPY = {
  body: '本清单内容由法务团队定稿后填入,预计 M3 内测前完成。',
};

export default function PersonalInfoListScreen() {
  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-xl pt-2xl">
      <Text className="text-sm text-ink-muted leading-relaxed text-center">{COPY.body}</Text>
    </ScrollView>
  );
}
