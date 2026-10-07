import { memo, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider, shallowEqual } from 'react-redux';
import { actions, addTodo, initialize, refresh, store, toggleTodo, useAppDispatch, useAppSelector } from './src/store';
import { renderSettings } from './src/performance';
import type { Todo } from './src/types';


const activity = Array.from({ length: 48000 }, (_, i) => ({ todo: `task-${String((i % 120) + 1).padStart(3, '0')}`, time: (i * 7919) % 100000, weight: (i % 7) + 1 }));
function activitySummary(id: string) {
  const recent = activity.filter(item => item.todo === id).sort((a, b) => b.time - a.time).slice(0, 24);
  return recent.reduce((total, item) => total + item.weight, 0);
}
function TodoRow({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
  const flash = useRef(new Animated.Value(0)).current;
  const activityScore = activitySummary(todo.id);
  useEffect(() => {
    if (!renderSettings.flash) return;
    flash.stopAnimation(); flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 650, useNativeDriver: false }).start();
  });
  return <>
    <Animated.View testID={`row-${todo.id}`} style={[styles.row, { borderColor: flash.interpolate({ inputRange: [0, 1], outputRange: ['#e9e8e4', '#f07845'] }) }]}>
      <Pressable testID={`toggle-${todo.id}`} accessibilityRole="checkbox" accessibilityState={{ checked: todo.completed }} aria-checked={todo.completed} accessibilityLabel={`Complete ${todo.title}`} onPress={() => onToggle(todo.id)} style={[styles.checkbox, todo.completed && styles.checked]}>
        <Text style={styles.checkmark}>{todo.completed ? '✓' : ''}</Text>
      </Pressable>
      <View style={styles.rowCopy}>
        <Text style={[styles.todoTitle, todo.completed && styles.done]} numberOfLines={2}>{todo.title}</Text>
        <Text style={styles.meta}>{todo.project}  ·  {activityScore > 0 ? 'Recently active' : 'Just added'}</Text>
      </View>
      <Text style={[styles.priority, todo.priority === 'high' && styles.high]}>{todo.priority === 'high' ? 'High' : 'Normal'}</Text>
    </Animated.View>
  </>;
}
const MemoTodoRow = memo(TodoRow);
function TodoList({ todos }: { todos: Todo[] }) {
  return <View style={styles.list}>{todos.map(todo => <MemoTodoRow key={todo.id} todo={{ ...todo }} onToggle={id => { void toggleTodo(id); }} />)}</View>;
}

function TodoScreen() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(({ config, todos, draft, loading, pending, notice, error }) => ({ config, todos, draft, loading, pending, notice, error }), shallowEqual);
  useEffect(() => { void initialize(); }, []);
  const completed = state.todos.filter(todo => todo.completed).length;
  return <SafeAreaView style={styles.safe}>
    <View style={styles.topbar}>
      <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandGlyph}>✓</Text></View><Text style={styles.brandText}>little list</Text></View>
      <View style={styles.identity}><Text style={styles.platform}>{Platform.OS === 'ios' ? 'iOS' : 'WEB'}</Text><View style={styles.avatar}><Text style={styles.avatarText}>RM</Text></View></View>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>MAKE ROOM FOR WHAT MATTERS</Text>
        <Text style={styles.title}>A little less to do.</Text>
        <Text style={styles.subtitle}>Big plans. Small steps. One list for all of it.</Text>
      </View>
      <View style={styles.board}>
        <View style={styles.boardHeading}><View style={styles.inline}><Text style={styles.boardTitle}>Your tasks</Text><View style={styles.count}><Text style={styles.countText}>{state.todos.length - completed}</Text></View></View>
          <Pressable testID="refresh" accessibilityRole="button" accessibilityLabel="Refresh tasks" onPress={() => { void refresh(); }}><Text style={styles.refresh}>↻  Refresh</Text></Pressable>
        </View>
        <View style={styles.composer}>
          <TextInput testID="draft" accessibilityLabel="New task" placeholder="What needs doing?" placeholderTextColor="#96968e" value={state.draft} onChangeText={text => dispatch(actions.draft(text))} onSubmitEditing={() => { void addTodo(); }} style={[styles.input, Platform.OS === 'web' ? { outlineWidth: 0 } : null]} maxLength={200} returnKeyType="done" />
          <View style={styles.composerFooter}><Text style={styles.selectedPriority}>↑  High priority</Text><Pressable testID="add" accessibilityRole="button" accessibilityLabel="Add task" disabled={state.pending || !state.draft.trim()} onPress={() => { void addTodo(); }} style={[styles.add, (state.pending || !state.draft.trim()) && styles.disabled]}><Text style={styles.addText}>{state.pending ? 'Saving…' : '+  Add task'}</Text></Pressable></View>
        </View>
        <View style={styles.status}>
          <Text testID="status" accessibilityLiveRegion="polite" style={[styles.statusText, state.error ? styles.error : null]}>{state.error || state.notice || (state.loading ? 'Connecting to your list…' : `${completed} completed · Keep a little momentum.`)}</Text>
        </View>
        <TodoList todos={state.todos} />
      </View>
      <Text style={styles.footer}>A local demo for Give Your Agents Perception  /  okthink</Text>
    </ScrollView>
    <View style={styles.lab}><View style={styles.dot} /><Text style={styles.labText}>DEMO LAB</Text><Text style={styles.labMode}>{state.config?.mode || 'connecting'} fixture</Text><Text style={styles.labNote}>Orange outlines show React commits</Text></View>
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><Provider store={store}><TodoScreen /></Provider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafaf7' },
  topbar: { paddingHorizontal: 28, height: 78, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e7e7e0', backgroundColor: '#ffffff' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandMark: { width: 29, height: 29, backgroundColor: '#ed7040', borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, brandGlyph: { fontSize: 21, fontWeight: '700', color: '#fff' }, brandText: { color: '#202721', fontSize: 22, fontWeight: '700', letterSpacing: -0.7 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 18 }, platform: { color: '#8a8b82', fontSize: 11, fontWeight: '700', letterSpacing: 2 }, avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e9eee4', alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 11, color: '#536048', fontWeight: '700' },
  content: { alignItems: 'center', paddingHorizontal: 22, paddingBottom: 50 },
  heading: { width: '100%', maxWidth: 760, paddingTop: 46, paddingBottom: 34, gap: 12 }, eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#8d755c' }, title: { fontSize: Platform.OS === 'web' ? 49 : 34, letterSpacing: -1.7, fontWeight: '700', color: '#24312b' }, subtitle: { color: '#82857c', fontSize: 14, lineHeight: 22 },
  board: { width: '100%', maxWidth: 760 }, boardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 19 }, inline: { flexDirection: 'row', alignItems: 'center', gap: 10 }, boardTitle: { fontSize: 20, fontWeight: '600', color: '#29342e' }, count: { backgroundColor: '#eaece4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }, countText: { color: '#76806d', fontSize: 12, fontWeight: '600' }, refresh: { color: '#7d8177', fontSize: 13 },
  composer: { borderWidth: 1, borderColor: '#d9dccf', borderRadius: 12, backgroundColor: '#fff', padding: 16, gap: 12 }, input: { fontSize: 17, color: '#26362b', minHeight: 33 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectedPriority: { fontSize: 12, color: '#ba754c', backgroundColor: '#fcf1e9', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6 }, add: { paddingHorizontal: 17, paddingVertical: 11, backgroundColor: '#2f513d', borderRadius: 8 }, addText: { color: '#fff', fontSize: 13, fontWeight: '600' }, disabled: { opacity: 0.5 },
  status: { minHeight: 43, justifyContent: 'center' }, statusText: { fontSize: 12, lineHeight: 18, color: '#7e8776' }, error: { color: '#b53c32' },
  list: { gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 13, borderWidth: 2, borderRadius: 10, backgroundColor: '#fff', minHeight: 79 }, checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.5, borderColor: '#d5dacf', alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: '#638067', borderColor: '#638067' }, checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 }, rowCopy: { flex: 1, gap: 7 }, todoTitle: { fontSize: 14, fontWeight: '500', color: '#384238', lineHeight: 20 }, done: { textDecorationLine: 'line-through', color: '#979e91' }, meta: { fontSize: 10, color: '#979b90' }, priority: { fontSize: 10, color: '#969b92' }, high: { color: '#bd7853' },
  footer: { fontSize: 10, color: '#a4a89d', paddingTop: 32 }, lab: { paddingHorizontal: 20, paddingVertical: 12, gap: 8, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e3e5db', backgroundColor: '#f2f3ec', flexWrap: 'wrap' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ed7040' }, labText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#767c6b' }, labMode: { fontSize: 10, color: '#7d836f' }, labNote: { fontSize: 10, color: '#969c8b' },
});
