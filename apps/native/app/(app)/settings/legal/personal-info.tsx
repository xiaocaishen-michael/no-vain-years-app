// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { ScrollView, Text } from 'react-native';

const COPY = {
  body: '本清单内容由法务团队定稿后填入,预计 M3 内测前完成。',
};

export default function PersonalInfoListScreen() {
  return (
    <ScrollView>
      <Text>{COPY.body}</Text>
    </ScrollView>
  );
}
